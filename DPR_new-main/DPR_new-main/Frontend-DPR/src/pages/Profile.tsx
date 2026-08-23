import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Avatar,
    Button,
    Divider,
    TextField,
    Stack,
    Card,
    CardContent,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAuth } from '../hooks/useAuth';

const Profile: React.FC = () => {
    const { user: authUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [user, setUser] = useState(authUser);

    if (!user) {
        return <Typography>Please log in to view your profile.</Typography>;
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        setIsEditing(false);
        // Save logic here
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59' }}>
                    User Profile
                </Typography>
                <Button
                    variant={isEditing ? "contained" : "outlined"}
                    startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                    onClick={isEditing ? handleSave : handleEditToggle}
                    color={isEditing ? "success" : "primary"}
                >
                    {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Left Column: Profile Card */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                        <CardContent sx={{ textAlign: 'center', py: 5 }}>
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                <Avatar
                                    alt={user.name}
                                    src="/static/images/avatar/1.jpg"
                                    sx={{ width: 120, height: 120, mx: 'auto', border: '4px solid white', boxShadow: 3, bgcolor: '#ff9933', fontSize: '3rem' }}
                                >
                                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                                </Avatar>
                                <Chip
                                    label="Active"
                                    color="success"
                                    size="small"
                                    sx={{ position: 'absolute', bottom: 5, right: 5, border: '2px solid white' }}
                                />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{user.name}</Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>{user.role}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {user.department}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Stack spacing={2} sx={{ textAlign: 'left', px: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ApartmentIcon color="action" />
                                    <Typography variant="body2">{user.location}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <WorkIcon color="action" />
                                    <Typography variant="body2">ID: {user.employeeId}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <SecurityIcon color="action" />
                                    <Typography variant="body2">Joined: {user.joinDate}</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column: Details & Settings */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        {/* Personal Information */}
                        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#0f2c59' }}>
                                Personal Information
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        value={user.name}
                                        disabled={!isEditing}
                                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Role / Designation"
                                        value={user.role}
                                        disabled={!isEditing}
                                        onChange={(e) => setUser({ ...user, role: e.target.value })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        value={user.email}
                                        disabled={!isEditing}
                                        InputProps={{ startAdornment: <EmailIcon color="action" sx={{ mr: 1 }} /> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        value={user.phone}
                                        disabled={!isEditing}
                                        InputProps={{ startAdornment: <PhoneIcon color="action" sx={{ mr: 1 }} /> }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Department"
                                        value={user.department}
                                        disabled={!isEditing}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Account Settings */}
                        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#0f2c59' }}>
                                Account Settings
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <NotificationsActiveIcon color="primary" />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>Email Notifications</Typography>
                                            <Typography variant="caption" color="text.secondary">Receive updates about DPR status changes</Typography>
                                        </Box>
                                    </Box>
                                    <Switch defaultChecked />
                                </Box>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                        <SecurityIcon color="primary" />
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600}>Two-Factor Authentication</Typography>
                                            <Typography variant="caption" color="text.secondary">Secure your account with 2FA</Typography>
                                        </Box>
                                    </Box>
                                    <Switch />
                                </Box>
                            </Stack>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Profile;
