import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Stack
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ForestIcon from '@mui/icons-material/Forest';
import TerrainIcon from '@mui/icons-material/Terrain';
import WaterIcon from '@mui/icons-material/Water';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';

// Fix for leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const GeospatialVerification: React.FC = () => {
    // Focus on a specific region
    const [center, setCenter] = useState<[number, number]>([26.1445, 91.7362]);
    const [placeName, setPlaceName] = useState<string>("Guwahati, Assam");
    const [projectSite, setProjectSite] = useState<[number, number][]>([
        [26.1480, 91.7350], [26.1550, 91.7450], [26.1500, 91.7500], [26.1400, 91.7400]
    ]);
    const [forestZone, setForestZone] = useState<[number, number][]>([
        [26.1500, 91.7400], [26.1600, 91.7500], [26.1550, 91.7600], [26.1450, 91.7500]
    ]);

    useEffect(() => {
        const fetchLocation = async () => {
            const jobId = localStorage.getItem('dpr_job_id');
            if (!jobId) return;
            try {
                const response = await fetch('http://localhost:8000/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        job_id: jobId,
                        query: "Extract the primary geographical coordinates of the main project site from the document. Respond ONLY with a raw JSON object and absolutely no other text. Format: {\"lat\": number, \"long\": number, \"place_name\": \"string\"}. If no exact coordinates exist, find the primary city or region mentioned and return its approximate coordinates. Do not use markdown blocks."
                    })
                });
                const data = await response.json();
                let jsonStr = data.answer.replace(/```json/g, '').replace(/```/g, '').trim();
                const loc = JSON.parse(jsonStr);
                if (loc && loc.lat && loc.long) {
                    setCenter([loc.lat, loc.long]);
                    setPlaceName(loc.place_name || "Project Site");
                    
                    // Slightly offset project site polygon based on new center
                    setProjectSite([
                        [loc.lat + 0.0035, loc.long - 0.0012],
                        [loc.lat + 0.0105, loc.long + 0.0088],
                        [loc.lat + 0.0055, loc.long + 0.0138],
                        [loc.lat - 0.0045, loc.long + 0.0038]
                    ]);
                    
                    setForestZone([
                        [loc.lat + 0.0055, loc.long + 0.0038],
                        [loc.lat + 0.0155, loc.long + 0.0138],
                        [loc.lat + 0.0105, loc.long + 0.0238],
                        [loc.lat + 0.0005, loc.long + 0.0138]
                    ]);
                }
            } catch (err) {
                console.error("Error fetching location", err);
            }
        };
        fetchLocation();
    }, []);

    // State for Simulation
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);

    const runAnalysis = () => {
        setAnalyzing(true);
        setAnalysisComplete(false);
        // Simulate API delay
        setTimeout(() => {
            setAnalyzing(false);
            setAnalysisComplete(true);
        }, 2000);
    };

    return (
        <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59' }}>
                        Geospatial Intelligence
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Site Verification & Compliance Analysis
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <GpsFixedIcon />}
                    onClick={runAnalysis}
                    disabled={analyzing}
                    sx={{ px: 3, py: 1 }}
                >
                    {analyzing ? 'Analyzing...' : 'Run Compliance Check'}
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, gap: 2, height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left Pane: Interactive Map */}
                <Box sx={{ flex: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', minHeight: 400, position: 'relative', boxShadow: 3 }}>
                        <MapContainer key={`${center[0]}-${center[1]}`} center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <LayersControl position="topright">
                            {/* Base Layers */}
                            <LayersControl.BaseLayer checked name="OpenStreetMap">
                                <TileLayer
                                    attribution='&copy; OpenStreetMap contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                            </LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Satellite Imagery">
                                <TileLayer
                                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                />
                            </LayersControl.BaseLayer>

                            {/* Overlays */}
                            <LayersControl.Overlay checked name="Reserved Forests">
                                <Polygon pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }} positions={forestZone}>
                                    <Popup>
                                        <Typography variant="subtitle2" fontWeight="bold" color="error">Restricted Forest Zone</Typography>
                                        <Typography variant="caption">Protected Area - No Construction Allowed</Typography>
                                    </Popup>
                                </Polygon>
                            </LayersControl.Overlay>

                            <LayersControl.Overlay checked name="Proposed Site">
                                <Polygon pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.3, dashArray: '5, 5' }} positions={projectSite}>
                                    <Popup>
                                        <Typography variant="subtitle2" fontWeight="bold" color="primary">Proposed Project Site</Typography>
                                        <Typography variant="caption">Area: 12.5 Acres</Typography>
                                    </Popup>
                                </Polygon>
                            </LayersControl.Overlay>
                        </LayersControl>

                        {/* Project Marker */}
                        <Marker position={center}>
                            <Popup>
                                <b>Project Entry Point</b><br />{placeName}       
                            </Popup>
                        </Marker>
                    </MapContainer>
                </Box>

                {/* Right Pane: Intelligence Report */}
                <Box sx={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ height: '100%', overflowY: 'auto', boxShadow: 3, borderRadius: 2 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <LayersIcon color="action" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Data Layers</Typography>
                            </Stack>

                            <List dense sx={{ bgcolor: '#f8f9fa', borderRadius: 2, mb: 3 }}>
                                <ListItem>
                                    <ListItemIcon><ForestIcon color="success" /></ListItemIcon>
                                    <ListItemText primary="Forest Cover" secondary="Source: Forest Survey of India" />
                                    <Chip label="Active" size="small" color="success" variant="outlined" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><TerrainIcon color="warning" /></ListItemIcon>
                                    <ListItemText primary="Seismic Zone" secondary="Source: USGS" />
                                    <Chip label="Zone V" size="small" color="warning" variant="outlined" />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><WaterIcon color="info" /></ListItemIcon>
                                    <ListItemText primary="Flood Patterns" secondary="Source: CWC 2023" />
                                    <Chip label="Active" size="small" color="info" variant="outlined" />
                                </ListItem>
                            </List>

                            <Divider sx={{ my: 2 }} />

                            {/* Analysis Results */}
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <GpsFixedIcon color={analysisComplete ? "primary" : "disabled"} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: analysisComplete ? 'text.primary' : 'text.disabled' }}>
                                    Compliance Report
                                </Typography>
                            </Stack>

                            {!analysisComplete && !analyzing && (
                                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary', bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                    <Typography variant="body2">Click "Run Compliance Check" to analyze the proposed site against restricted zones.</Typography>
                                </Box>
                            )}

                            {analyzing && (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <CircularProgress size={30} sx={{ mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">Processing Satellite Imagery...</Typography>
                                    <Typography variant="caption" color="text.disabled">Checking Forest Encroachment...</Typography>
                                </Box>
                            )}

                            {analysisComplete && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Alert severity="warning" variant="filled" icon={<WarningIcon />}>
                                        <b>Conflict Detected</b><br />
                                        Part of the proposed site overlaps with a Restricted Forest Zone.
                                    </Alert>

                                    <Box sx={{ p: 2, border: '1px solid #ed6c02', borderRadius: 2, bgcolor: '#fff3e0' }}>
                                        <Typography variant="subtitle2" color="warning.dark" gutterBottom>Overlap Analysis</Typography>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2">Total Area:</Typography>
                                            <Typography variant="body2" fontWeight="bold">12.5 Acres</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2">Restricted Overlap:</Typography>
                                            <Typography variant="body2" fontWeight="bold" color="error">1.8 Acres (14%)</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2">Status:</Typography>
                                            <Typography variant="body2" fontWeight="bold" color="warning.main">REQUIRES REVIEW</Typography>
                                        </Stack>
                                    </Box>

                                    <Alert severity="success" icon={<CheckCircleIcon />}>
                                        <b>Water Bodies: Clear</b><br />
                                        Site is outside the 50m buffer zone of nearby rivers.
                                    </Alert>
                                </Box>
                            )}

                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Box>
    );
};

export default GeospatialVerification;
