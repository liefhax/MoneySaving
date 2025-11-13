// app/(tabs)/overview.tsx - VERSI FINAL DIPERBAIKI
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Modal, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTotals, getTransactions, getUniqueSources } from '../../services/database';

interface OverviewProps {
  totalIncome?: number;
  totalExpenses?: number;
  statisticsData?: any;
}

type PeriodType = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
type ChartType = 'bar' | 'line' | 'pie';

const { width: screenWidth } = Dimensions.get('window');

const Overview: React.FC<OverviewProps> = () => {
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('Monthly');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [financialHealth, setFinancialHealth] = useState<'Excellent' | 'Good' | 'Fair' | 'Poor'>('Good');
  const [savingsRate, setSavingsRate] = useState(0);
  const [topCategories, setTopCategories] = useState<{name: string, amount: number, percentage: number, color: string}[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const [chartData, setChartData] = useState<any[]>([]);

  // Animasi fade in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch data dari database
  useEffect(() => {
    loadOverviewData();
  }, [periodType, selectedDate]);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      
      const totalsData = await getTotals();
      const transactions = await getTransactions();
      
      setTotals({
        income: totalsData.income || 0,
        expense: totalsData.expense || 0,
        balance: totalsData.balance || 0
      });
      
      await processFinancialMetrics(totalsData, transactions);
      await processChartData(transactions);
      
    } catch (error) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processFinancialMetrics = async (totals: any, transactions: any[]) => {
    try {
      // Calculate Savings Rate
      const savingsRate = totals.income > 0 ? 
        ((totals.income - totals.expense) / totals.income) * 100 : 0;
      setSavingsRate(savingsRate);

      // Determine Financial Health
      let health: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Good';
      if (savingsRate >= 20) health = 'Excellent';
      else if (savingsRate >= 10) health = 'Good';
      else if (savingsRate >= 5) health = 'Fair';
      else health = 'Poor';
      setFinancialHealth(health);

      // Calculate Top Categories dari database
      const categoryMap = new Map();
      transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const current = categoryMap.get(transaction.source) || 0;
          categoryMap.set(transaction.source, current + transaction.amount);
        }
      });

      const totalExpense = totals.expense || 1;
      const colors = ['#FF7675', '#74B9FF', '#FDCB6E', '#A29BFE', '#00B894', '#FD79A8', '#FFA726', '#26C6DA', '#AB47BC', '#EC407A'];
      
      const categories = Array.from(categoryMap.entries())
        .map(([name, amount], index) => ({
          name: name || 'Unknown',
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      setTopCategories(categories);

      // Determine Monthly Trend
      await calculateMonthlyTrend(transactions);
      
    } catch (error) {
      console.error('Error processing financial metrics:', error);
    }
  };

  const calculateMonthlyTrend = async (transactions: any[]) => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const currentMonthExpenses = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear &&
                 transaction.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      const lastMonthExpenses = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === lastMonth && 
                 transactionDate.getFullYear() === lastMonthYear &&
                 transaction.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      if (currentMonthExpenses > lastMonthExpenses) {
        setMonthlyTrend('up');
      } else if (currentMonthExpenses < lastMonthExpenses) {
        setMonthlyTrend('down');
      } else {
        setMonthlyTrend('stable');
      }
    } catch (error) {
      console.error('Error calculating monthly trend:', error);
      setMonthlyTrend('stable');
    }
  };

  const processChartData = async (transactions: any[]) => {
    try {
      let data: any[] = [];

      switch (periodType) {
        case 'Daily':
          data = await processDailyData(transactions);
          break;
        case 'Weekly':
          data = await processWeeklyData(transactions);
          break;
        case 'Monthly':
          data = await processMonthlyData(transactions);
          break;
        case 'Yearly':
          data = await processYearlyData(transactions);
          break;
      }
      
      setChartData(data);
    } catch (error) {
      console.error('Error processing chart data:', error);
      setChartData([]);
    }
  };

  const processDailyData = async (transactions: any[]) => {
    const days = [];
    const currentDate = new Date(selectedDate);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - i);
      
      const dayIncome = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.toDateString() === targetDate.toDateString() &&
                 transaction.type === 'income';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
      const dayExpense = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.toDateString() === targetDate.toDateString() &&
                 transaction.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      days.push({
        label: dayNames[targetDate.getDay()],
        income: dayIncome,
        expense: dayExpense,
        fullDate: targetDate.getDate()
      });
    }
    
    return days;
  };

  const processWeeklyData = async (transactions: any[]) => {
    const weeks = [];
    const currentDate = new Date(selectedDate);
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setDate(currentDate.getDate() - (i * 7));
      
      const weekStart = new Date(targetDate);
      weekStart.setDate(targetDate.getDate() - targetDate.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekIncome = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= weekStart && transactionDate <= weekEnd &&
                 transaction.type === 'income';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
      const weekExpense = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= weekStart && transactionDate <= weekEnd &&
                 transaction.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      weeks.push({
        label: `W${i + 1}`,
        income: weekIncome,
        expense: weekExpense,
        weekNumber: i + 1
      });
    }
    
    return weeks;
  };

  const processMonthlyData = async (transactions: any[]) => {
    const months = [];
    const currentDate = new Date(selectedDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentDate);
      targetDate.setMonth(currentDate.getMonth() - i);
      
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      
      const monthIncome = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === targetMonth &&
                 transactionDate.getFullYear() === targetYear &&
                 transaction.type === 'income';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
      const monthExpense = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === targetMonth &&
                 transactionDate.getFullYear() === targetYear &&
                 transaction.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      months.push({
        label: monthNames[targetMonth],
        income: monthIncome,
        expense: monthExpense,
        fullMonth: `${monthNames[targetMonth]} ${targetYear}`
      });
    }
    
    return months;
  };

  const processYearlyData = async (transactions: any[]) => {
    const years = [];
    const currentYear = selectedDate.getFullYear();
    
    for (let i = 5; i >= 0; i--) {
      const targetYear = currentYear - i;
      
      const yearIncome = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getFullYear() === targetYear &&
                 transaction.type === 'income';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
        
      const yearExpense = transactions
        .filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getFullYear() === targetYear &&
                 transaction.type === 'expense';
        })
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      
      years.push({
        label: targetYear.toString().slice(2),
        income: yearIncome,
        expense: yearExpense,
        fullYear: targetYear
      });
    }
    
    return years;
  };

  // Simple Bar Chart
  const SimpleBarChart = ({ data, width, height }: { data: any[], width: number, height: number }) => {
    if (!data || data.length === 0) {
      return (
        <View style={[styles.chartPlaceholder, { width, height: height - 40 }]}>
          <Ionicons name="bar-chart" size={48} color="#DFE6E9" />
          <Text style={styles.chartPlaceholderText}>No Data Available</Text>
          <Text style={styles.chartPlaceholderSubtext}>Add transactions to see charts</Text>
        </View>
      );
    }

    const maxValue = Math.max(...data.flatMap(d => [d.income, d.expense])) || 1;
    const barWidth = (width - 100) / data.length;
    
    return (
      <View style={[styles.simpleChartContainer, { width, height }]}>
        <Text style={styles.chartTitle}>Income vs Expense Comparison</Text>
        
        {/* Legend di atas chart */}
        <View style={styles.legendAboveChart}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#00B894' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF7675' }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>

        <View style={[styles.barsContainer, { height: height - 140 }]}>
          {data.map((item, index) => {
            const incomeHeight = (item.income / maxValue) * (height - 180);
            const expenseHeight = (item.expense / maxValue) * (height - 180);
            
            return (
              <View key={index} style={styles.barGroup}>
                <View style={styles.barColumn}>
                  <View 
                    style={[
                      styles.bar, 
                      styles.incomeBar,
                      { 
                        height: Math.max(incomeHeight, 4),
                        width: barWidth * 0.35
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bar, 
                      styles.expenseBar,
                      { 
                        height: Math.max(expenseHeight, 4),
                        width: barWidth * 0.35,
                        marginTop: 4
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.monthLabel} numberOfLines={1}>{item.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary values - DIPINDAH KE ATAS */}
        <View style={styles.chartSummaryFixed}>
          <View style={styles.summaryItemFixed}>
            <Text style={styles.summaryLabelFixed}>Max Income</Text>
            <Text style={[styles.summaryValueFixed, styles.incomeColor]}>
              {formatShortCurrency(Math.max(...data.map(d => d.income)))}
            </Text>
          </View>
          <View style={styles.summarySeparator} />
          <View style={styles.summaryItemFixed}>
            <Text style={styles.summaryLabelFixed}>Max Expense</Text>
            <Text style={[styles.summaryValueFixed, styles.expenseColor]}>
              {formatShortCurrency(Math.max(...data.map(d => d.expense)))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Line Chart yang SANGAT DISEDERHANAKAN - FIXED
  const SimpleLineChart = ({ data, width, height }: { data: any[], width: number, height: number }) => {
    if (!data || data.length === 0) {
      return (
        <View style={[styles.chartPlaceholder, { width, height: height - 40 }]}>
          <Ionicons name="trending-up" size={48} color="#DFE6E9" />
          <Text style={styles.chartPlaceholderText}>No Data Available</Text>
          <Text style={styles.chartPlaceholderSubtext}>Add transactions to see trends</Text>
        </View>
      );
    }

    const maxValue = Math.max(...data.flatMap(d => [d.income, d.expense])) || 1;
    const chartHeight = 180; // Fixed height untuk chart area
    
    return (
      <View style={[styles.simpleChartContainer, { width, height }]}>
        <Text style={styles.chartTitle}>Income vs Expense Trend</Text>
        
        {/* Legend */}
        <View style={styles.legendAboveChart}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#00B894' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF7675' }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>

        {/* Chart Area dengan BORDER untuk batas yang jelas */}
        <View style={[styles.chartAreaWithBorder, { height: chartHeight, width: width - 40 }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxisFixed}>
            <Text style={styles.yAxisLabel}>{formatShortCurrency(maxValue)}</Text>
            <Text style={styles.yAxisLabel}>{formatShortCurrency(maxValue * 0.75)}</Text>
            <Text style={styles.yAxisLabel}>{formatShortCurrency(maxValue * 0.5)}</Text>
            <Text style={styles.yAxisLabel}>{formatShortCurrency(maxValue * 0.25)}</Text>
            <Text style={styles.yAxisLabel}>0</Text>
          </View>

          {/* Chart content dengan OVERFLOW HIDDEN */}
          <View style={styles.chartContentFixed}>
            {/* Grid lines */}
            <View style={styles.gridLineHorizontal} />
            <View style={[styles.gridLineHorizontal, { top: '25%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '50%' }]} />
            <View style={[styles.gridLineHorizontal, { top: '75%' }]} />
            
            {/* Income Line - SEDERHANA */}
            <View style={styles.linePathContainer}>
              {data.map((item, index) => {
                if (index === data.length - 1) return null;
                const nextItem = data[index + 1];
                
                const currentX = (index / (data.length - 1)) * (width - 100);
                const currentY = chartHeight - 20 - ((item.income / maxValue) * (chartHeight - 40));
                const nextX = ((index + 1) / (data.length - 1)) * (width - 100);
                const nextY = chartHeight - 20 - ((nextItem.income / maxValue) * (chartHeight - 40));
                
                return (
                  <View
                    key={`income-line-${index}`}
                    style={[
                      styles.incomeLineFixed,
                      {
                        left: currentX + 4,
                        top: Math.min(currentY, nextY),
                        width: Math.sqrt(Math.pow(nextX - currentX, 2) + Math.pow(nextY - currentY, 2)),
                        transform: [
                          { 
                            rotate: `${Math.atan2(nextY - currentY, nextX - currentX)}rad` 
                          }
                        ],
                      }
                    ]}
                  />
                );
              })}
            </View>
            
            {/* Expense Line - SEDERHANA */}
            <View style={styles.linePathContainer}>
              {data.map((item, index) => {
                if (index === data.length - 1) return null;
                const nextItem = data[index + 1];
                
                const currentX = (index / (data.length - 1)) * (width - 100);
                const currentY = chartHeight - 20 - ((item.expense / maxValue) * (chartHeight - 40));
                const nextX = ((index + 1) / (data.length - 1)) * (width - 100);
                const nextY = chartHeight - 20 - ((nextItem.expense / maxValue) * (chartHeight - 40));
                
                return (
                  <View
                    key={`expense-line-${index}`}
                    style={[
                      styles.expenseLineFixed,
                      {
                        left: currentX + 4,
                        top: Math.min(currentY, nextY),
                        width: Math.sqrt(Math.pow(nextX - currentX, 2) + Math.pow(nextY - currentY, 2)),
                        transform: [
                          { 
                            rotate: `${Math.atan2(nextY - currentY, nextX - currentX)}rad` 
                          }
                        ],
                      }
                    ]}
                  />
                );
              })}
            </View>

            {/* Data Points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * (width - 100);
              const incomeY = chartHeight - 20 - ((item.income / maxValue) * (chartHeight - 40));
              const expenseY = chartHeight - 20 - ((item.expense / maxValue) * (chartHeight - 40));
              
              return (
                <View key={`points-${index}`}>
                  {/* Income Point */}
                  <View
                    style={[
                      styles.dataPointFixed,
                      styles.incomePoint,
                      {
                        left: x,
                        top: incomeY,
                      }
                    ]}
                  />
                  {/* Expense Point */}
                  <View
                    style={[
                      styles.dataPointFixed,
                      styles.expensePoint,
                      {
                        left: x,
                        top: expenseY,
                      }
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* X-axis labels - DI LUAR chart area */}
        <View style={styles.xAxisContainerFixed}>
          {data.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.xAxisLabelFixed,
                {
                  left: (index / (data.length - 1)) * (width - 100) - 15,
                }
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          ))}
        </View>

        {/* Summary values - DI ATAS x-axis labels */}
        <View style={styles.chartSummaryFixed}>
          <View style={styles.summaryItemFixed}>
            <Text style={styles.summaryLabelFixed}>Max Income</Text>
            <Text style={[styles.summaryValueFixed, styles.incomeColor]}>
              {formatShortCurrency(Math.max(...data.map(d => d.income)))}
            </Text>
          </View>
          <View style={styles.summarySeparator} />
          <View style={styles.summaryItemFixed}>
            <Text style={styles.summaryLabelFixed}>Max Expense</Text>
            <Text style={[styles.summaryValueFixed, styles.expenseColor]}>
              {formatShortCurrency(Math.max(...data.map(d => d.expense)))}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Simple Pie Chart - DIPERBAIKI dengan warna yang benar
  const SimplePieChart = ({ data, width, height }: { data: any[], width: number, height: number }) => {
    if (!data || data.length === 0) {
      return (
        <View style={[styles.chartPlaceholder, { width, height: height - 40 }]}>
          <Ionicons name="pie-chart" size={48} color="#DFE6E9" />
          <Text style={styles.chartPlaceholderText}>No Data Available</Text>
          <Text style={styles.chartPlaceholderSubtext}>Add expense transactions to see breakdown</Text>
        </View>
      );
    }

    const total = data.reduce((sum, item) => sum + item.amount, 0) || 1;
    
    // Generate pie segments dengan warna yang benar
    const renderPieSegments = () => {
      let currentAngle = 0;
      const segments = [];

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const segmentAngle = (item.amount / total) * 360;
        
        // Skip segments yang terlalu kecil (kurang dari 1 derajat)
        if (segmentAngle < 1) continue;

        const segment = (
          <View
            key={i}
            style={[
              styles.pieSegment,
              {
                backgroundColor: item.color,
                transform: [
                  { rotate: `${currentAngle}deg` },
                ],
              }
            ]}
          />
        );
        
        segments.push(segment);
        currentAngle += segmentAngle;
      }
      
      return segments;
    };

    return (
      <View style={[styles.simpleChartContainer, { width, height }]}>
        <Text style={styles.chartTitle}>Expense Breakdown</Text>
        
        <View style={styles.pieContainer}>
          <View style={styles.pieChart}>
            {renderPieSegments()}
            <View style={styles.pieCenter}>
              <Text style={styles.pieCenterText}>Total</Text>
              <Text style={styles.pieCenterSubtext}>{formatShortCurrency(total)}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.pieLegend}>
          {data.map((item, index) => (
            <View key={index} style={styles.pieLegendItem}>
              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {item.name} ({Math.round((item.amount / total) * 100)}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Navigation functions
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    switch (periodType) {
      case 'Daily':
        newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'Weekly':
        newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'Monthly':
        newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'Yearly':
        newDate.setFullYear(selectedDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setSelectedDate(newDate);
  };

  const getPeriodDisplayText = () => {
    switch (periodType) {
      case 'Daily':
        return selectedDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'Weekly':
        const weekStart = new Date(selectedDate);
        weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'Monthly':
        return selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'Yearly':
        return selectedDate.getFullYear().toString();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOverviewData();
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'Rp 0';
    return value.toLocaleString('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      maximumFractionDigits: 0 
    });
  };

  const formatShortCurrency = (value: number) => {
    if (isNaN(value)) return 'Rp 0';
    const absValue = Math.abs(value);
    
    if (absValue >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}B`;
    } else if (absValue >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}M`;
    } else if (absValue >= 1000) {
      return `Rp ${(value / 1000).toFixed(1)}K`;
    }
    return `Rp ${Math.round(value)}`;
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent': return '#00B894';
      case 'Good': return '#74B9FF';
      case 'Fair': return '#FDCB6E';
      case 'Poor': return '#FF7675';
      default: return '#636E72';
    }
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriodType(newPeriod);
    setShowPeriodModal(false);
  };

  const handleChartTypeChange = (newType: ChartType) => {
    setChartType(newType);
    setShowChartModal(false);
  };

  // Loading component
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading financial overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim }}>

        {/* === FINANCE OVERVIEW SECTION === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finance Overview</Text>
          
          <View style={styles.overviewGrid}>
            {/* Total Income Card */}
            <View style={[styles.overviewCard, styles.incomeCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardNumber, { backgroundColor: '#00B894' }]}>
                  <Text style={styles.cardNumberText}>1</Text>
                </View>
                <Text style={styles.cardTitle}>Total Income</Text>
              </View>
              <Text style={[styles.cardAmount, styles.incomeColor]}>
                {formatCurrency(totals.income)}
              </Text>
              <Text style={styles.cardSubtitle}>All time income</Text>
            </View>

            {/* Current Balance Card */}
            <View style={[styles.overviewCard, styles.balanceCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardNumber, { backgroundColor: '#6C5CE7' }]}>
                  <Text style={styles.cardNumberText}>2</Text>
                </View>
                <Text style={styles.cardTitle}>Current Balance</Text>
              </View>
              <Text style={[styles.cardAmount, styles.positiveBalance]}>
                {formatCurrency(totals.balance)}
              </Text>
              <Text style={styles.cardSubtitle}>Net worth</Text>
            </View>

            {/* Monthly Average Card */}
            <View style={[styles.overviewCard, styles.savingsCard]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardNumber, { backgroundColor: '#00B894' }]}>
                  <Text style={styles.cardNumberText}>3</Text>
                </View>
                <Text style={styles.cardTitle}>Monthly Average</Text>
              </View>
              <Text style={[styles.cardAmount, styles.savingsColor]}>
                {formatCurrency(Math.round(totals.income / 12))}
              </Text>
              <Text style={styles.cardSubtitle}>Per month</Text>
            </View>
          </View>
        </View>

        {/* === ADVANCED ANALYTICS SECTION === */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Advanced Analytics</Text>
            <TouchableOpacity 
              style={styles.chartTypeButton}
              onPress={() => setShowChartModal(true)}
            >
              <Ionicons name="stats-chart" size={18} color="#6C5CE7" />
              <Text style={styles.chartTypeText}>{chartType.toUpperCase()}</Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Period Navigation */}
          <View style={styles.periodNavigation}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigatePeriod('prev')}
            >
              <Ionicons name="chevron-back" size={20} color="#6C5CE7" />
            </TouchableOpacity>
            
            <View style={styles.periodDisplay}>
              <Text style={styles.periodText}>{getPeriodDisplayText()}</Text>
              <TouchableOpacity 
                style={styles.periodSelector}
                onPress={() => setShowPeriodModal(true)}
              >
                <Text style={styles.periodTypeText}>{periodType}</Text>
                <Ionicons name="chevron-down" size={14} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={() => navigatePeriod('next')}
            >
              <Ionicons name="chevron-forward" size={20} color="#6C5CE7" />
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            {chartType === 'bar' && (
              <SimpleBarChart 
                data={chartData} 
                width={screenWidth - 80} 
                height={350} 
              />
            )}
            
            {chartType === 'line' && (
              <SimpleLineChart 
                data={chartData} 
                width={screenWidth - 80} 
                height={350} 
              />
            )}
            
            {chartType === 'pie' && (
              <SimplePieChart 
                data={topCategories} 
                width={screenWidth - 80} 
                height={350} 
              />
            )}
          </View>
        </View>

        {/* === TOP SPENDING CATEGORIES === */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          <View style={styles.categoriesContainer}>
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
                    <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
                    <Text style={styles.categoryAmount}>{formatCurrency(category.amount)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No spending data available</Text>
            )}
          </View>
        </View>

        {/* === FINANCIAL INSIGHTS === */}
        <View style={[styles.section, styles.lastSection]}>
          <Text style={styles.sectionTitle}>Financial Insights</Text>
          <View style={styles.insightsContainer}>
            <View style={styles.insightItem}>
              <Ionicons name="bulb-outline" size={24} color="#FDCB6E" />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Spending Alert</Text>
                <Text style={styles.insightDescription}>
                  Your expenses are {monthlyTrend === 'up' ? 'increasing' : monthlyTrend === 'down' ? 'decreasing' : 'stable'} this month
                </Text>
              </View>
            </View>
            
            <View style={styles.insightItem}>
              <Ionicons name="trophy-outline" size={24} color="#00B894" />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Savings Goal</Text>
                <Text style={styles.insightDescription}>
                  {savingsRate >= 20 ? 'Excellent! Keep maintaining your savings rate' :
                   savingsRate >= 10 ? 'Good job! You can save more' :
                   savingsRate >= 5 ? 'Fair savings rate, aim for 10%' :
                   'Consider increasing your savings rate'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />

      </Animated.View>

      {/* Chart Type Modal */}
      <Modal
        visible={showChartModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Chart Type</Text>
            {(['bar', 'line', 'pie'] as ChartType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chartOption,
                  chartType === type && styles.selectedChartOption
                ]}
                onPress={() => handleChartTypeChange(type)}
              >
                <Text style={[
                  styles.chartOptionText,
                  chartType === type && styles.selectedChartOptionText
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                </Text>
                {chartType === type && (
                  <Ionicons name="checkmark" size={20} color="#6C5CE7" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowChartModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Period Type Modal */}
      <Modal
        visible={showPeriodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Period</Text>
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as PeriodType[]).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodOption,
                  periodType === period && styles.selectedPeriodOption
                ]}
                onPress={() => handlePeriodChange(period)}
              >
                <Text style={[
                  styles.periodOptionText,
                  periodType === period && styles.selectedPeriodOptionText
                ]}>
                  {period}
                </Text>
                {periodType === period && (
                  <Ionicons name="checkmark" size={20} color="#6C5CE7" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPeriodModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#636E72',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
  },
  // Period Navigation
  periodNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  periodDisplay: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodTypeText: {
    fontSize: 12,
    color: '#6C5CE7',
    marginRight: 4,
    fontWeight: '500',
  },
  // Overview Cards
  overviewGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  overviewCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  incomeCard: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#00B894',
  },
  balanceCard: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#6C5CE7',
  },
  savingsCard: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#00B894',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 14,
    color: '#636E72',
    fontWeight: '500',
  },
  cardAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#636E72',
  },
  incomeColor: {
    color: '#00B894',
  },
  expenseColor: {
    color: '#FF7675',
  },
  positiveBalance: {
    color: '#00B894',
  },
  savingsColor: {
    color: '#00B894',
  },
  // Chart Controls
  chartTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartTypeText: {
    fontSize: 12,
    color: '#6C5CE7',
    marginHorizontal: 4,
    fontWeight: '500',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 350,
  },
  // Chart Styles
  simpleChartContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingVertical: 10,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Legend
  legendAboveChart: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 15,
    marginTop: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#636E72',
  },
  // Bar Chart Styles
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  barGroup: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  barColumn: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 3,
    minHeight: 4,
  },
  incomeBar: {
    backgroundColor: '#00B894',
  },
  expenseBar: {
    backgroundColor: '#FF7675',
  },
  monthLabel: {
    fontSize: 10,
    color: '#636E72',
    marginTop: 4,
    textAlign: 'center',
  },
  // Line Chart Styles - FIXED
  chartAreaWithBorder: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DFE6E9',
    position: 'relative',
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden', // IMPORTANT: Prevent lines from going outside
  },
  yAxisFixed: {
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 10,
    marginRight: 8,
    width: 50,
  },
  yAxisLabel: {
    fontSize: 9,
    color: '#636E72',
    textAlign: 'right',
  },
  chartContentFixed: {
    flex: 1,
    position: 'relative',
    height: '100%',
    overflow: 'hidden', // IMPORTANT: Contain lines within chart
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#DFE6E9',
    opacity: 0.5,
  },
  linePathContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  incomeLineFixed: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00B894',
    transformOrigin: 'left center',
  },
  expenseLineFixed: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#FF7675',
    transformOrigin: 'left center',
  },
  dataPointFixed: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  incomePoint: {
    backgroundColor: '#00B894',
  },
  expensePoint: {
    backgroundColor: '#FF7675',
  },
  xAxisContainerFixed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  xAxisLabelFixed: {
    fontSize: 10,
    color: '#636E72',
    textAlign: 'center',
    minWidth: 25,
    maxWidth: 40,
  },
  // Chart Summary - FIXED POSITION
  chartSummaryFixed: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    borderRadius: 8,
  },
  summaryItemFixed: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabelFixed: {
    fontSize: 10,
    color: '#636E72',
    marginBottom: 2,
    textAlign: 'center',
  },
  summaryValueFixed: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  summarySeparator: {
    width: 1,
    height: 20,
    backgroundColor: '#DFE6E9',
  },
  // Pie Chart Styles - DIPERBAIKI
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pieChart: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    position: 'relative',
  },
  pieSegment: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 70,
    transformOrigin: 'center',
  },
  pieCenter: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    top: 35,
    left: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pieCenterText: {
    fontSize: 12,
    color: '#2D3436',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pieCenterSubtext: {
    fontSize: 10,
    color: '#636E72',
    textAlign: 'center',
  },
  pieLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  // Common Chart Styles
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#636E72',
    marginTop: 8,
    textAlign: 'center',
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#B2BEC3',
    marginTop: 4,
    textAlign: 'center',
  },
  // Categories
  categoriesContainer: {
    marginTop: 8,
  },
  categoryItem: {
    marginBottom: 16,
    paddingHorizontal: 5,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    color: '#2D3436',
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 12,
    color: '#636E72',
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#DFE6E9',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 10,
    color: '#636E72',
    textAlign: 'right',
  },
  noDataText: {
    textAlign: 'center',
    color: '#636E72',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  // Insights
  insightsContainer: {
    marginTop: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  insightContent: {
    flex: 1,
    marginLeft: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: '#636E72',
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 80,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 20,
    textAlign: 'center',
  },
  chartOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedChartOption: {
    backgroundColor: '#F8F9FA',
  },
  chartOptionText: {
    fontSize: 16,
    color: '#2D3436',
  },
  selectedChartOptionText: {
    color: '#6C5CE7',
    fontWeight: '500',
  },
  periodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPeriodOption: {
    backgroundColor: '#F8F9FA',
  },
  periodOptionText: {
    fontSize: 16,
    color: '#2D3436',
  },
  selectedPeriodOptionText: {
    color: '#6C5CE7',
    fontWeight: '500',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Overview;