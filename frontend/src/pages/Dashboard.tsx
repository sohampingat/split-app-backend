import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { expensesAPI, groupsAPI, settlementsAPI } from '../services/api';
import { Expense, Group } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalGroups: 0,
    totalOwed: 0,
    totalToReceive: 0,
  });

  const { user } = useAuth();
  const { showError } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load recent expenses
      const expensesResponse = await expensesAPI.getExpenses({ limit: 5 });
      if (expensesResponse.success && expensesResponse.data) {
        setRecentExpenses(expensesResponse.data.expenses);
        setStats(prev => ({
          ...prev,
          totalExpenses: expensesResponse.data!.pagination.totalExpenses,
        }));
      }

      // Load groups
      const groupsResponse = await groupsAPI.getGroups();
      if (groupsResponse.success && groupsResponse.data) {
        setGroups(groupsResponse.data.groups.slice(0, 3)); // Show only first 3
        setStats(prev => ({
          ...prev,
          totalGroups: groupsResponse.data!.count,
        }));
      }

      // Load balance information
      try {
        const balanceResponse = await settlementsAPI.getBalances();
        if (balanceResponse.success && balanceResponse.data) {
          // Process balance data - this would depend on your backend response format
          setBalance(user?.totalBalance || 0);
        }
      } catch (error) {
        // Balance endpoint might not be fully implemented yet
        setBalance(user?.totalBalance || 0);
      }

    } catch (error: any) {
      showError('Failed to load dashboard data');
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return 'success.main';
    if (amount < 0) return 'error.main';
    return 'text.secondary';
  };

  const getBalanceText = (amount: number) => {
    if (amount > 0) return `You are owed ${formatCurrency(amount)}`;
    if (amount < 0) return `You owe ${formatCurrency(Math.abs(amount))}`;
    return 'You are all settled up!';
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{ width: 60, height: 60 }}
              src={user?.avatar}
              alt={user?.name}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Welcome back, {user?.name?.split(' ')[0]}! 👋
              </Typography>
              <Typography variant="body1" sx={{ color: 'white', opacity: 0.9 }}>
                {getBalanceText(balance)}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ 
              backgroundColor: 'white', 
              color: 'primary.main',
              '&:hover': { backgroundColor: 'grey.100' }
            }}
            onClick={() => navigate('/expenses')}
          >
            Add Expense
          </Button>
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <ReceiptIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalExpenses}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Expenses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <GroupIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalGroups}
                  </Typography>
                  <Typography color="text.secondary">
                    Groups
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color={getBalanceColor(balance)}>
                    {formatCurrency(Math.abs(balance))}
                  </Typography>
                  <Typography color="text.secondary">
                    {balance >= 0 ? 'You are owed' : 'You owe'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <BalanceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {balance === 0 ? '✅' : '⏳'}
                  </Typography>
                  <Typography color="text.secondary">
                    {balance === 0 ? 'Settled Up' : 'Pending'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Expenses */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent Expenses
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/expenses')}
                >
                  View All
                </Button>
              </Box>
              
              {recentExpenses.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No expenses yet. Add your first expense to get started!
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/expenses')}
                  >
                    Add Expense
                  </Button>
                </Box>
              ) : (
                <Box>
                  {recentExpenses.map((expense, index) => (
                    <Box key={expense.id}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" py={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            {expense.description.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {expense.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Paid by {expense.paid_by_name} • {new Date(expense.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6" fontWeight="bold">
                            {formatCurrency(expense.amount)}
                          </Typography>
                          <Chip
                            label={expense.category}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      {index < recentExpenses.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Groups */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Your Groups
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/groups')}
                >
                  View All
                </Button>
              </Box>

              {groups.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No groups yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Create a group to split expenses with friends
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/groups')}
                  >
                    Create Group
                  </Button>
                </Box>
              ) : (
                <Box>
                  {groups.map((group, index) => (
                    <Box key={group.id}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between" 
                        py={2}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/groups/${group.id}`)}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: 'secondary.light' }}>
                            {group.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight="medium">
                              {group.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {group.members.length} members
                            </Typography>
                          </Box>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(group.totalExpenses)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Total
                          </Typography>
                        </Box>
                      </Box>
                      {index < groups.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;