#!/bin/bash
# security-scan.sh - Container security scanning and hardening

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔒 Running container security scan...${NC}"

# Function to scan image for vulnerabilities
scan_image() {
    local image=$1
    echo -e "${YELLOW}Scanning $image for vulnerabilities...${NC}"
    
    # Use Docker Scout if available
    if command -v docker &> /dev/null && docker scout --help &> /dev/null; then
        echo "Using Docker Scout for vulnerability scanning..."
        docker scout cves $image --format sarif --output $image-scan.sarif
        docker scout recommendations $image
    fi
    
    # Use Trivy if available
    if command -v trivy &> /dev/null; then
        echo "Using Trivy for comprehensive scanning..."
        trivy image --severity HIGH,CRITICAL --format table $image
        trivy image --format json --output $image-trivy.json $image
    fi
    
    # Use Grype if available
    if command -v grype &> /dev/null; then
        echo "Using Grype for vulnerability scanning..."
        grype $image -o json --file $image-grype.json
    fi
}

# Function to check container runtime security
check_runtime_security() {
    echo -e "${YELLOW}Checking runtime security configuration...${NC}"
    
    # Check for non-root users
    echo "Checking for non-root users in containers..."
    docker-compose config | grep -A 5 -B 5 "user:" || echo "⚠️  No explicit user configuration found"
    
    # Check for security options
    echo "Checking security options..."
    docker-compose config | grep -A 3 -B 3 "security_opt:" || echo "ℹ️  No security options specified"
    
    # Check for read-only filesystems
    echo "Checking read-only configurations..."
    docker-compose config | grep -A 3 -B 3 "read_only:" || echo "ℹ️  No read-only configurations found"
    
    # Check for capability drops
    echo "Checking capability configurations..."
    docker-compose config | grep -A 5 -B 5 "cap_" || echo "ℹ️  No capability configurations found"
}

# Function to suggest security improvements
suggest_improvements() {
    echo -e "${YELLOW}🔧 Security Improvement Suggestions:${NC}"
    
    cat << EOF
1. Enable security scanning in CI/CD:
   - Add container scanning to build pipeline
   - Set up automated vulnerability alerts
   - Implement security gates for critical vulnerabilities

2. Runtime security enhancements:
   - Use AppArmor/SELinux profiles
   - Enable seccomp filters
   - Drop unnecessary capabilities
   - Run containers as non-root users

3. Network security:
   - Use custom networks with minimal access
   - Implement network policies
   - Enable TLS encryption for all communications

4. Secret management:
   - Use Docker secrets or external secret managers
   - Avoid storing secrets in environment variables
   - Rotate secrets regularly

5. Image security:
   - Use minimal base images (distroless, scratch)
   - Keep base images updated
   - Sign images with Docker Content Trust
   - Use multi-stage builds to reduce attack surface

6. Monitoring and compliance:
   - Enable audit logging
   - Monitor container runtime behavior
   - Implement compliance checks (CIS benchmarks)
   - Set up security incident response procedures
EOF
}

# Main execution
main() {
    # List of images to scan
    images=(
        "hotel-booking-backend:latest"
        "hotel-booking-frontend:latest"
        "hotel-booking-backend-dev:latest"
    )
    
    # Build images first if they don't exist
    for image in "${images[@]}"; do
        if ! docker images | grep -q "${image%:*}"; then
            echo -e "${YELLOW}Building $image...${NC}"
            case $image in
                *backend*)
                    docker build -t $image -f backend/Dockerfile.distroless backend/
                    ;;
                *frontend*)
                    docker build -t $image -f frontend/Dockerfile.secure frontend/
                    ;;
            esac
        fi
    done
    
    # Scan each image
    for image in "${images[@]}"; do
        scan_image $image
    done
    
    # Check runtime security
    check_runtime_security
    
    # Provide suggestions
    suggest_improvements
    
    echo -e "${GREEN}✅ Security scan completed!${NC}"
    echo -e "${YELLOW}📋 Check generated scan reports for detailed findings.${NC}"
}

# Install security tools if not present
install_tools() {
    echo -e "${YELLOW}Installing security scanning tools...${NC}"
    
    # Install Trivy
    if ! command -v trivy &> /dev/null; then
        echo "Installing Trivy..."
        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
    fi
    
    # Install Grype
    if ! command -v grype &> /dev/null; then
        echo "Installing Grype..."
        curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
    fi
}

# Check if tools should be installed
if [[ "${1}" == "--install-tools" ]]; then
    install_tools
    exit 0
fi

# Run main function
main
