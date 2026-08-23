import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Button,
    Stack,
    Pagination,
    Menu,
    MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getStatusColor, getScoreColor } from '../utils/statusHelpers';

// Mock Data
const initialDocuments = [
    { id: 'DPR-2023-001', name: 'Road Infrastructure Improvement - Assam Phase I', state: 'Assam', date: '2023-10-25', status: 'Approved', score: 88 },
    { id: 'DPR-2023-002', name: 'Urban Water Supply Scheme - Imphal', state: 'Manipur', date: '2023-10-24', status: 'Processing', score: null },
    { id: 'DPR-2023-003', name: 'Community Health Center Construction', state: 'Nagaland', date: '2023-10-23', status: 'Review Needed', score: 45 },
    { id: 'DPR-2023-004', name: 'Solar Grid Implementation - Agartala', state: 'Tripura', date: '2023-10-22', status: 'Approved', score: 92 },
    { id: 'DPR-2023-005', name: 'Eco-Tourism Circuit Development', state: 'Meghalaya', date: '2023-10-20', status: 'Rejected', score: 12 },
    { id: 'DPR-2023-006', name: 'Rural Connectivity Bridge', state: 'Sikkim', date: '2023-10-18', status: 'Approved', score: 78 },
    { id: 'DPR-2023-007', name: 'Smart Classroom Project', state: 'Mizoram', date: '2023-10-15', status: 'Processing', score: null },
    { id: 'DPR-2023-008', name: 'Flood Management System', state: 'Assam', date: '2023-10-12', status: 'Review Needed', score: 60 },
];

const AllDocuments: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [documents] = useState(initialDocuments);
    const [page, setPage] = useState(1);

    const filteredDocs = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.state.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2c59', mb: 1 }}>
                        All Documents
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage and track all submitted DPRs across regions.
                    </Typography>
                </Box>
                <Button variant="contained" color="primary" startIcon={<DownloadIcon />}>
                    Export List
                </Button>
            </Box>

            <Paper sx={{ width: '100%', mb: 2, p: 2, borderRadius: 2, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
                {/* Toolbar */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} justifyContent="space-between">
                    <TextField
                        placeholder="Search by ID, Name or State..."
                        variant="outlined"
                        size="small"
                        sx={{ width: { xs: '100%', sm: 400 } }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button variant="outlined" startIcon={<FilterListIcon />}>
                        Filter
                    </Button>
                </Stack>

                {/* Table */}
                <TableContainer>
                    <Table sx={{ minWidth: 700 }} aria-label="customized table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>DPR ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Project Title</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>State</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Quality Score</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDocs.map((doc) => (
                                <TableRow key={doc.id} hover>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                                        {doc.id}
                                    </TableCell>
                                    <TableCell>{doc.name}</TableCell>
                                    <TableCell>{doc.state}</TableCell>
                                    <TableCell>{doc.date}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={doc.status}
                                            color={getStatusColor(doc.status as any)}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {doc.score !== null ? (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: getScoreColor(doc.score)
                                                }}
                                            >
                                                {doc.score}%
                                            </Typography>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">--</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary">
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small">
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Pagination count={3} color="primary" page={page} onChange={(e, v) => setPage(v)} />
                </Box>
            </Paper>
        </Box>
    );
};

export default AllDocuments;
