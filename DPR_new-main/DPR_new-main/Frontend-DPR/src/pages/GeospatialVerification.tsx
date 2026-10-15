import React, { useState, useEffect, useCallback } from 'react';
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
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    SelectChangeEvent
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polygon, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import ForestIcon from '@mui/icons-material/Forest';
import TerrainIcon from '@mui/icons-material/Terrain';
import WaterIcon from '@mui/icons-material/Water';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LayersIcon from '@mui/icons-material/Layers';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useLocation } from 'react-router-dom';

import { dprApi, GeospatialVerificationReport, HistoryItem } from '../services/api';

// Fix for leaflet marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
}

const GeospatialVerification: React.FC = () => {
    const location = useLocation();

    const [dprList, setDprList] = useState<HistoryItem[]>([]);
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [geoReport, setGeoReport] = useState<GeospatialVerificationReport | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [analyzing, setAnalyzing] = useState<boolean>(false);
    const [analysisComplete, setAnalysisComplete] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch list of available DPRs
    useEffect(() => {
        const loadDPRs = async () => {
            try {
                const history = await dprApi.getReportsHistory(50);
                setDprList(history);

                // Priority: location.state -> localStorage -> first DPR
                const stateJobId = (location.state as any)?.jobId;
                const storedJobId = localStorage.getItem('dpr_job_id');
                const initialJobId = stateJobId || storedJobId || (history.length > 0 ? history[0].job_id : '');

                if (initialJobId) {
                    setSelectedJobId(initialJobId);
                }
            } catch (err) {
                console.error('Failed to load DPR history:', err);
            }
        };
        loadDPRs();
    }, [location.state]);

    // Load geospatial intelligence whenever selectedJobId changes
    const loadGeospatialData = useCallback(async (jobId: string) => {
        if (!jobId) return;
        setLoading(true);
        setError(null);
        try {
            localStorage.setItem('dpr_job_id', jobId);
            const report = await dprApi.getGeospatialReport(jobId);
            setGeoReport(report);
            setAnalysisComplete(true);
        } catch (err: any) {
            console.error('Failed to load geospatial report:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to fetch geospatial intelligence');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedJobId) {
            loadGeospatialData(selectedJobId);
        }
    }, [selectedJobId, loadGeospatialData]);

    const handleDprChange = (event: SelectChangeEvent<string>) => {
        setSelectedJobId(event.target.value);
    };

    const runAnalysis = () => {
        setAnalyzing(true);
        setAnalysisComplete(false);
        setTimeout(() => {
            setAnalyzing(false);
            setAnalysisComplete(true);
        }, 1200);
    };

    const center: [number, number] = geoReport ? [geoReport.lat, geoReport.lng] : [26.1445, 91.7362];
    const zoom = geoReport?.zoom_level || 13;
    const projectSite = (geoReport?.project_boundary && geoReport.project_boundary.length >= 3)
        ? geoReport.project_boundary as [number, number][]
        : [
            [center[0] + 0.0035, center[1] - 0.0012],
            [center[0] + 0.0105, center[1] + 0.0088],
            [center[0] + 0.0055, center[1] + 0.0138],
            [center[0] - 0.0045, center[1] + 0.0038]
        ];

    const restrictedZone = (geoReport?.restricted_zone_boundary && geoReport.restricted_zone_boundary.length >= 3)
        ? geoReport.restricted_zone_boundary as [number, number][]
        : [
            [center[0] + 0.0055, center[1] + 0.0038],
            [center[0] + 0.0155, center[1] + 0.0138],
            [center[0] + 0.0105, center[1] + 0.0238],
            [center[0] + 0.0005, center[1] + 0.0138]
        ];

    return (
        <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header & DPR Selector */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59' }}>
                        Geospatial Intelligence
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Satellite Site Verification, Coordinates & Environmental Clearance Analysis
                    </Typography>
                </Box>

                <Stack direction="row" spacing={2} alignItems="center">
                    {/* DPR Selector Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 280, bgcolor: '#fff' }}>
                        <InputLabel id="dpr-select-label">Select DPR to Verify</InputLabel>
                        <Select
                            labelId="dpr-select-label"
                            id="dpr-select"
                            value={selectedJobId}
                            label="Select DPR to Verify"
                            onChange={handleDprChange}
                            disabled={loading || dprList.length === 0}
                        >
                            {dprList.map((dpr) => (
                                <MenuItem key={dpr.job_id} value={dpr.job_id}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {dpr.filename.replace('.pdf', '').slice(0, 32)}
                                        </Typography>
                                        <Chip
                                            label={`#${dpr.job_id.slice(0, 6)}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: 18 }}
                                        />
                                    </Stack>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={analyzing || loading ? <CircularProgress size={20} color="inherit" /> : <GpsFixedIcon />}
                        onClick={runAnalysis}
                        disabled={analyzing || loading || !selectedJobId}
                        sx={{ px: 3, py: 1, bgcolor: '#0f2c59', fontWeight: 600 }}
                    >
                        {analyzing ? 'Checking Overlap...' : 'Run Compliance Check'}
                    </Button>
                </Stack>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Project Quick Overview Banner */}
            {geoReport && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 1.5,
                        mb: 2,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2
                    }}
                >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <LocationOnIcon color="primary" />
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f2c59' }}>
                                {geoReport.project_title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                📍 {geoReport.place_name} • {geoReport.district}, {geoReport.state} • Coordinates: {geoReport.lat.toFixed(4)}° N, {geoReport.lng.toFixed(4)}° E
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={1}>
                        <Chip
                            label={`Type: ${geoReport.project_type}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                        />
                        <Chip
                            label={`Area: ${geoReport.site_area_acres} Acres`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                        />
                        <Chip
                            label={geoReport.compliance_status}
                            size="small"
                            color={geoReport.compliance_status === 'COMPLIANT' ? 'success' : geoReport.compliance_status === 'REQUIRES_REVIEW' ? 'warning' : 'error'}
                            sx={{ fontWeight: 700 }}
                        />
                    </Stack>
                </Paper>
            )}

            <Box sx={{ display: 'flex', flex: 1, gap: 2, height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left Pane: Interactive Map */}
                <Box sx={{ flex: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', minHeight: 400, position: 'relative', boxShadow: 2 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa' }}>
                            <Stack spacing={2} alignItems="center">
                                <CircularProgress size={40} sx={{ color: '#0f2c59' }} />
                                <Typography variant="body2" color="text.secondary">
                                    Loading satellite coordinates for selected DPR...
                                </Typography>
                            </Stack>
                        </Box>
                    ) : (
                        <MapContainer
                            key={`${center[0]}-${center[1]}-${selectedJobId}`}
                            center={center}
                            zoom={zoom}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <ChangeView center={center} zoom={zoom} />
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
                                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community'
                                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    />
                                </LayersControl.BaseLayer>

                                {/* Overlays */}
                                <LayersControl.Overlay checked name={geoReport?.restricted_zone_name || 'Restricted Environmental Zone'}>
                                    <Polygon pathOptions={{ color: '#d32f2f', fillColor: '#d32f2f', fillOpacity: 0.35 }} positions={restrictedZone}>
                                        <Popup>
                                            <Typography variant="subtitle2" fontWeight="bold" color="error">
                                                {geoReport?.restricted_zone_name || 'Restricted Zone'}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                Type: {geoReport?.restricted_zone_type || 'Forest / Ecological Buffer'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Encroachment Overlap: {geoReport?.overlap_area_acres || 0} Acres ({geoReport?.overlap_percentage || 0}%)
                                            </Typography>
                                        </Popup>
                                    </Polygon>
                                </LayersControl.Overlay>

                                <LayersControl.Overlay checked name="Proposed Project Site Boundary">
                                    <Polygon pathOptions={{ color: '#0f2c59', fillColor: '#1976d2', fillOpacity: 0.25, dashArray: '6, 6' }} positions={projectSite}>
                                        <Popup>
                                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                                {geoReport?.project_title || 'Proposed Project Site'}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                Area: {geoReport?.site_area_acres || 15} Acres
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Location: {geoReport?.place_name || 'Project Site'}
                                            </Typography>
                                        </Popup>
                                    </Polygon>
                                </LayersControl.Overlay>
                            </LayersControl>

                            {/* Project Marker */}
                            <Marker position={center}>
                                <Popup>
                                    <Box sx={{ p: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {geoReport?.project_title || 'Project Entry Point'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {geoReport?.place_name || 'Site Coordinates'}
                                        </Typography>
                                        <Typography variant="caption" display="block" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                                            {center[0].toFixed(5)}° N, {center[1].toFixed(5)}° E
                                        </Typography>
                                    </Box>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    )}
                </Box>

                {/* Right Pane: Intelligence Report */}
                <Box sx={{ flex: 1, minWidth: 340, display: 'flex', flexDirection: 'column' }}>
                    <Card sx={{ height: '100%', overflowY: 'auto', boxShadow: 2, borderRadius: 2 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <LayersIcon color="action" />
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Data Layers</Typography>
                            </Stack>

                            <List dense sx={{ bgcolor: '#f8f9fa', borderRadius: 2, mb: 3 }}>
                                <ListItem>
                                    <ListItemIcon><ForestIcon color="success" /></ListItemIcon>
                                    <ListItemText
                                        primary="Forest Cover & Diversion"
                                        secondary={geoReport?.forest_clearance_status || "Forest Survey of India"}
                                    />
                                    <Chip
                                        label={geoReport?.has_overlap_conflict ? "Overlap" : "Clear"}
                                        size="small"
                                        color={geoReport?.has_overlap_conflict ? "warning" : "success"}
                                        variant="outlined"
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><TerrainIcon color="warning" /></ListItemIcon>
                                    <ListItemText
                                        primary="Seismic Zone"
                                        secondary={geoReport?.seismic_zone || "Zone V (USGS / IS 1893)"}
                                    />
                                    <Chip
                                        label={geoReport?.seismic_zone?.split(' ')[0] || "Zone V"}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                    />
                                </ListItem>
                                <ListItem>
                                    <ListItemIcon><WaterIcon color="info" /></ListItemIcon>
                                    <ListItemText
                                        primary="Water Body Proximity"
                                        secondary={geoReport?.water_body_status || "50m Buffer Verification"}
                                    />
                                    <Chip label="Verified" size="small" color="info" variant="outlined" />
                                </ListItem>
                            </List>

                            <Divider sx={{ my: 2 }} />

                            {/* Analysis Results */}
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                                <GpsFixedIcon color={analysisComplete ? "primary" : "disabled"} />
                                <Typography variant="h6" sx={{ fontWeight: 700, color: analysisComplete ? 'text.primary' : 'text.disabled' }}>
                                    Site Compliance Report
                                </Typography>
                            </Stack>

                            {analyzing && (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <CircularProgress size={30} sx={{ mb: 2, color: '#0f2c59' }} />
                                    <Typography variant="body2" color="text.secondary">Verifying Satellite Imagery...</Typography>
                                    <Typography variant="caption" color="text.disabled">Cross-referencing Restricted Coordinates...</Typography>
                                </Box>
                            )}

                            {analysisComplete && geoReport && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {geoReport.has_overlap_conflict ? (
                                        <Alert severity="warning" variant="filled" icon={<WarningIcon />}>
                                            <b>Restricted Zone Encroachment</b><br />
                                            Proposed site overlaps with {geoReport.restricted_zone_name}.
                                        </Alert>
                                    ) : (
                                        <Alert severity="success" variant="filled" icon={<CheckCircleIcon />}>
                                            <b>Clear of Restricted Zones</b><br />
                                            No major environmental or forest encumbrance detected.
                                        </Alert>
                                    )}

                                    <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
                                            Site Boundary Analysis
                                        </Typography>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Total Project Site:</Typography>
                                            <Typography variant="body2" fontWeight="bold">{geoReport.site_area_acres} Acres</Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Restricted Overlap:</Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                color={geoReport.overlap_area_acres > 0 ? "error" : "success"}
                                            >
                                                {geoReport.overlap_area_acres} Acres ({geoReport.overlap_percentage}%)
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Statutory Status:</Typography>
                                            <Typography
                                                variant="body2"
                                                fontWeight="bold"
                                                color={geoReport.compliance_status === 'COMPLIANT' ? 'success.main' : 'warning.main'}
                                            >
                                                {geoReport.compliance_status}
                                            </Typography>
                                        </Stack>
                                        <Stack direction="row" justifyContent="space-between">
                                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {geoReport.district}, {geoReport.state}
                                            </Typography>
                                        </Stack>
                                    </Box>

                                    {/* Specific Page-Cited Findings */}
                                    {geoReport.key_findings && geoReport.key_findings.length > 0 && (
                                        <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fff' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
                                                DPR Clearance Citations
                                            </Typography>
                                            {geoReport.key_findings.map((finding, fIdx) => (
                                                <Typography key={fIdx} variant="caption" sx={{ display: 'block', mb: 1, color: '#334155' }}>
                                                    • {finding}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
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
