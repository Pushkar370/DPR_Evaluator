import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';
import { ActivityItem } from '../../constants/mockData';
import { getStatusColor, getScoreColor } from '../../utils';

interface RecentActivityTableProps {
  activities: ActivityItem[];
}

/**
 * Recent Activity Table Component
 * Displays recent uploads and analysis results
 */
export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ activities }) => {
  return (
    <Card sx={{ boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)', borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#0f2c59' }}>
          Recent Uploads & Analysis
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>File Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Quality Score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.status}
                      color={getStatusColor(row.status)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {row.score !== null ? (
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: getScoreColor(row.score)
                        }}
                      >
                        {row.score}%
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">--</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};
