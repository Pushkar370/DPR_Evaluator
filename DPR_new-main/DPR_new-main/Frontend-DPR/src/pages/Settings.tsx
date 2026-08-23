import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Card,
    CardContent,
    Divider,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    Avatar,
    Stack
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';

interface SettingsProps {
}

const Settings: React.FC<SettingsProps> = () => {
    const [tabIndex, setTabIndex] = useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 3 }}>
                System Settings
            </Typography>

            <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label="settings tabs"
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
                <Tab icon={<SecurityIcon />} iconPosition="start" label="Security" />
                <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
                <Tab icon={<PaletteIcon />} iconPosition="start" label="Appearance" />
            </Tabs>

            {/* Profile Settings */}
            {tabIndex === 0 && (
                <Stack spacing={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Public Profile</Typography>
                            <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
                                <Avatar sx={{ width: 80, height: 80, bgcolor: '#ff9933', fontSize: '1.5rem' }}>DA</Avatar>
                                <Box>
                                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>Change Picture</Button>
                                    <Button variant="text" size="small" color="error">Delete</Button>
                                </Box>
                            </Stack>
                            <Stack spacing={2} direction="row">
                                <TextField label="First Name" defaultValue="District" fullWidth size="small" />
                                <TextField label="Last Name" defaultValue="Admin" fullWidth size="small" />
                            </Stack>
                            <Box sx={{ mt: 2 }}>
                                <TextField label="Email" defaultValue="admin@doner.gov.in" fullWidth size="small" />
                            </Box>
                        </CardContent>
                    </Card>
                </Stack>
            )}

            {/* Security Settings */}
            {tabIndex === 1 && (
                <Stack spacing={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Password & Authentication</Typography>
                            <Button variant="outlined" color="primary">Change Password</Button>
                            <Box sx={{ mt: 3 }}>
                                <FormControlLabel control={<Switch defaultChecked />} label="Two-Factor Authentication (2FA)" />
                            </Box>
                        </CardContent>
                    </Card>
                </Stack>
            )}

            {/* Notifications */}
            {tabIndex === 2 && (
                <Stack spacing={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Email Notifications</Typography>
                            <FormControlLabel control={<Switch defaultChecked />} label="DPR Upload Alerts" sx={{ display: 'block', mb: 1 }} />
                            <FormControlLabel control={<Switch defaultChecked />} label="Security Alerts" sx={{ display: 'block', mb: 1 }} />
                            <FormControlLabel control={<Switch />} label="Weekly Reports" sx={{ display: 'block', mb: 1 }} />
                        </CardContent>
                    </Card>
                </Stack>
            )}

            {/* Appearance */}
            {tabIndex === 3 && (
                <Stack spacing={3}>
                    <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography>Theme settings are managed by the administrator.</Typography>
                    </Paper>
                </Stack>
            )}
        </Box>
    );
};

export default Settings;
