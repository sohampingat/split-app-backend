import React from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

const Expenses: React.FC = () => {
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Expenses
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Expense
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon! 🚧
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Expense management features are being developed. You'll be able to add, edit, and track all your expenses here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Expenses;