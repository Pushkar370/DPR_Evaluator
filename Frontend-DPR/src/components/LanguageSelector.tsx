import React from 'react';
import { useTranslation } from 'react-i18next';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import LanguageIcon from '@mui/icons-material/Language';
import Box from '@mui/material/Box';

const LanguageSelector: React.FC = () => {
    const { i18n } = useTranslation();

    const handleChange = (event: SelectChangeEvent) => {
        i18n.changeLanguage(event.target.value);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LanguageIcon sx={{ color: 'white', mr: 1 }} />
            <FormControl variant="standard" sx={{ m: 1, minWidth: 120 }}>
                <Select
                    value={i18n.language}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Without label' }}
                    sx={{
                        color: 'white',
                        '.MuiSelect-icon': { color: 'white' },
                        '&:before': { borderColor: 'rgba(255,255,255,0.5)' },
                        '&:after': { borderColor: 'white' }
                    }}
                >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                    <MenuItem value="mr">मराठी (Marathi)</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};

export default LanguageSelector;
