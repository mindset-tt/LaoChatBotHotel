import React from 'react';
import { Box, Typography, Container, Link, useTheme, alpha } from '@mui/material';
import { Hotel, Copyright } from '@mui/icons-material';

export const Footer = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 3,
        px: 2,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        borderTop: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Logo and Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hotel sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
                Hotel AI
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Intelligent Assistant
              </Typography>
            </Box>
          </Box>

          {/* Project Info */}
          <Box sx={{ textAlign: { xs: 'center', md: 'center' } }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
              ການພັດທະນາແຊັດບອດສຳລັບໃຫ້ຂໍ້ມູນການບໍລິການຂອງໂຮງແຮມຄອນເຊຍນາ
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Developing a Chatbot for Providing Hotel Consiana Service Information
            </Typography>
          </Box>

          {/* Copyright */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Copyright sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
            <Typography variant="body2" color="textSecondary">
              {currentYear} Hotel AI. All rights reserved.
            </Typography>
          </Box>
        </Box>

        {/* Team Information */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
              ອາຈານທີ່ປຶກສາ:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ຊອ. ປທ. ທອງສິງ ສີວົງໄຊ
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
              ຜູ້ຊ່ວຍທີ່ປຶກສາ:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ຊອ. ປທ. ສຸກປະເສີດ ບັນຈົງ
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}>
              ພັດທະນາໂດຍ:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ນາງ ສຸກດາວີ ສີວິໄລ
            </Typography>
            <Typography variant="body2" color="textSecondary">
              ທ້າວ ພູທອງເພັດ ພັນທະປັນຍາ
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
