import React, { useEffect, useState } from 'react';
import { getDashboardData } from '../apis/dashboardApi';

const useDashboardData = () => {
  const [cardData, setCardData] = useState(null);
  const [recentExamData, setRecentExamData] = useState(null);
  const [appealData, setAppealData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getDashboardData();

        const { card, recentExam, appeal, chart } = res;
        setCardData(card ?? null);
        setRecentExamData(recentExam ?? null);
        setAppealData(appeal ?? null);
        setChartData(chart ?? null);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, [refresh]);

  const refreshItems = () => {
    setRefresh(!refresh);
  };

  return {
    cardData,
    recentExamData,
    appealData,
    chartData,
    refreshItems,
  };
};

export default useDashboardData;
