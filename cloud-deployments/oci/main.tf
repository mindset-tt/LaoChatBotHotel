# Oracle Cloud Infrastructure (OCI) Deployment
# Terraform configuration for Hotel AI Assistant

terraform {
  required_providers {
    oci = {
      source = "oracle/oci"
      version = "~> 4.0"
    }
  }
}

provider "oci" {
  region = var.region
}

# Variables
variable "region" {
  description = "OCI region"
  default     = "us-ashburn-1"
}

variable "compartment_id" {
  description = "OCI compartment OCID"
  type        = string
}

variable "environment_name" {
  description = "Environment name for resources"
  default     = "hotel-ai-prod"
}

# Data sources
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_id
}

data "oci_core_images" "ubuntu_images" {
  compartment_id = var.compartment_id
  operating_system = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape = "VM.Standard.A1.Flex"
  sort_by = "TIMECREATED"
  sort_order = "DESC"
}

# VCN (Virtual Cloud Network)
resource "oci_core_vcn" "main_vcn" {
  compartment_id = var.compartment_id
  display_name   = "${var.environment_name}-vcn"
  cidr_blocks    = ["10.0.0.0/16"]
  dns_label      = "hotelai"
}

# Internet Gateway
resource "oci_core_internet_gateway" "main_igw" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main_vcn.id
  display_name   = "${var.environment_name}-igw"
}

# Route Table
resource "oci_core_route_table" "public_rt" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main_vcn.id
  display_name   = "${var.environment_name}-public-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.main_igw.id
  }
}

# Security List
resource "oci_core_security_list" "public_sl" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main_vcn.id
  display_name   = "${var.environment_name}-public-sl"

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 8000
      max = 8000
    }
  }
}

# Public Subnet
resource "oci_core_subnet" "public_subnet" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main_vcn.id
  display_name   = "${var.environment_name}-public-subnet"
  cidr_block     = "10.0.1.0/24"
  route_table_id = oci_core_route_table.public_rt.id
  security_list_ids = [oci_core_security_list.public_sl.id]
  dns_label      = "public"
}

# Container Instance Cluster
resource "oci_containerengine_cluster" "k8s_cluster" {
  compartment_id     = var.compartment_id
  kubernetes_version = "v1.28.2"
  name               = "${var.environment_name}-cluster"
  vcn_id             = oci_core_vcn.main_vcn.id

  options {
    service_lb_subnet_ids = [oci_core_subnet.public_subnet.id]
    add_ons {
      is_kubernetes_dashboard_enabled = false
      is_tiller_enabled               = false
    }
  }
}

# Node Pool
resource "oci_containerengine_node_pool" "k8s_node_pool" {
  cluster_id         = oci_containerengine_cluster.k8s_cluster.id
  compartment_id     = var.compartment_id
  kubernetes_version = "v1.28.2"
  name               = "${var.environment_name}-node-pool"

  node_config_details {
    placement_configs {
      availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
      subnet_id           = oci_core_subnet.public_subnet.id
    }
    size = 2
  }

  node_shape = "VM.Standard.A1.Flex"

  node_shape_config {
    memory_in_gbs = 8
    ocpus         = 2
  }

  node_source_details {
    image_id    = data.oci_core_images.ubuntu_images.images[0].id
    source_type = "IMAGE"
  }

  initial_node_labels {
    key   = "name"
    value = "${var.environment_name}-node"
  }
}

# Object Storage Bucket for models
resource "oci_objectstorage_bucket" "models_bucket" {
  compartment_id = var.compartment_id
  name           = "${var.environment_name}-models"
  namespace      = data.oci_objectstorage_namespace.user_namespace.namespace
  access_type    = "NoPublicAccess"
}

# Object Storage Bucket for frontend
resource "oci_objectstorage_bucket" "frontend_bucket" {
  compartment_id = var.compartment_id
  name           = "${var.environment_name}-frontend"
  namespace      = data.oci_objectstorage_namespace.user_namespace.namespace
  access_type    = "ObjectRead"
}

data "oci_objectstorage_namespace" "user_namespace" {
  compartment_id = var.compartment_id
}

# Load Balancer
resource "oci_load_balancer_load_balancer" "main_lb" {
  compartment_id = var.compartment_id
  display_name   = "${var.environment_name}-lb"
  shape          = "flexible"
  
  shape_details {
    maximum_bandwidth_in_mbps = 100
    minimum_bandwidth_in_mbps = 10
  }

  subnet_ids = [oci_core_subnet.public_subnet.id]
}

# Load Balancer Backend Set
resource "oci_load_balancer_backend_set" "backend_set" {
  load_balancer_id = oci_load_balancer_load_balancer.main_lb.id
  name             = "${var.environment_name}-backend-set"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol          = "HTTP"
    interval_ms       = 10000
    port              = 8000
    timeout_in_millis = 3000
    url_path          = "/health"
  }
}

# Load Balancer Listener
resource "oci_load_balancer_listener" "main_listener" {
  load_balancer_id         = oci_load_balancer_load_balancer.main_lb.id
  name                     = "${var.environment_name}-listener"
  default_backend_set_name = oci_load_balancer_backend_set.backend_set.name
  port                     = 80
  protocol                 = "HTTP"
}

# Outputs
output "cluster_id" {
  description = "OKE Cluster ID"
  value       = oci_containerengine_cluster.k8s_cluster.id
}

output "load_balancer_ip" {
  description = "Load Balancer Public IP"
  value       = oci_load_balancer_load_balancer.main_lb.ip_address_details[0].ip_address
}

output "models_bucket_name" {
  description = "Models Storage Bucket Name"
  value       = oci_objectstorage_bucket.models_bucket.name
}

output "frontend_bucket_name" {
  description = "Frontend Storage Bucket Name"
  value       = oci_objectstorage_bucket.frontend_bucket.name
}
