import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
    return (
        <Card
            sx={{
                height: '100%',
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
                borderRadius: 2,
                transition: 'transform 0.2s',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px 0 rgba(0,0,0,0.1)'
                }
            }}
        >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    {/* Left Side: Title and Value */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {value}
                        </Typography>
                    </Box>

                    {/* Right Side: Icon */}
                    <Box
                        sx={{
                            bgcolor: alpha(color, 0.1),
                            color: color,
                            borderRadius: '50%',
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {icon}
                    </Box>
                </Stack>

                {/* Bottom Section: Subtitle or Trend */}
                {(subtitle || trend) && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        {trend && (
                            <Typography variant="caption" sx={{ color: color, fontWeight: 700, mr: 1, display: 'flex', alignItems: 'center' }}>
                                {trend}
                            </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default StatCard;
