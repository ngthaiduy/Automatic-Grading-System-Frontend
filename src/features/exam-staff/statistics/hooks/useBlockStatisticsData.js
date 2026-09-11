import { useCallback, useEffect, useState } from 'react';
import blockApi from '../../../../services/blockApi';
import examApi from '../../../../services/examApi';
import statisticsApi from '../../../../services/statisticsApi';
import { ensureArray, unwrapApiData } from '../utils/statisticsHelpers';

const useBlockStatisticsData = ({ examId, blockId }) => {
  const [exam, setExam] = useState(null);
  const [currentBlock, setCurrentBlock] = useState(null);
  const [examBlocks, setExamBlocks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [comparisonMap, setComparisonMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comparisonLoading, setComparisonLoading] = useState(false);

  const loadCoreData = useCallback(async () => {
    if (!examId || !blockId) return;

    setLoading(true);
    setError('');

    const [examRes, blockRes, blocksRes, statsRes] = await Promise.allSettled([
      examApi.getById(examId),
      blockApi.getById(examId, blockId),
      blockApi.getByExam(examId),
      statisticsApi.getBlockStatistics(examId, blockId),
    ]);

    if (examRes.status === 'fulfilled') {
      setExam(unwrapApiData(examRes.value));
    }

    if (blockRes.status === 'fulfilled') {
      setCurrentBlock(unwrapApiData(blockRes.value));
    }

    if (blocksRes.status === 'fulfilled') {
      setExamBlocks(ensureArray(unwrapApiData(blocksRes.value)));
    } else {
      setExamBlocks([]);
    }

    if (statsRes.status === 'fulfilled') {
      setStatistics(unwrapApiData(statsRes.value));
    } else {
      setStatistics(null);
    }

    if (
      examRes.status !== 'fulfilled'
      || blockRes.status !== 'fulfilled'
      || statsRes.status !== 'fulfilled'
    ) {
      setError('Không thể tải đầy đủ dữ liệu thống kê của block.');
    }

    setLoading(false);
  }, [examId, blockId]);

  const loadComparisonData = useCallback(async () => {
    if (!examId || !examBlocks.length) {
      setComparisonMap(new Map());
      setComparisonLoading(false);
      return;
    }

    setComparisonLoading(true);

    const nextMap = new Map();

    if (blockId && statistics) {
      nextMap.set(blockId, {
        statistics,
      });
    }

    const blocksToFetch = examBlocks.filter((block) => block?.blockId && block.blockId !== blockId);

    const settledResults = await Promise.allSettled(
      blocksToFetch.map(async (block) => ({
        blockId: block.blockId,
        statistics: unwrapApiData(await statisticsApi.getBlockStatistics(examId, block.blockId)),
      })),
    );

    settledResults.forEach((item) => {
      if (item.status === 'fulfilled' && item.value?.blockId) {
        nextMap.set(item.value.blockId, {
          statistics: item.value.statistics,
        });
      }
    });

    setComparisonMap(nextMap);
    setComparisonLoading(false);
  }, [blockId, examBlocks, examId, statistics]);

  useEffect(() => {
    void loadCoreData();
  }, [loadCoreData]);

  useEffect(() => {
    if (!statistics) return;
    void loadComparisonData();
  }, [loadComparisonData, statistics]);

  return {
    exam,
    currentBlock,
    examBlocks,
    statistics,
    comparisonMap,
    loading,
    error,
    comparisonLoading,
    reload: loadCoreData,
  };
};

export default useBlockStatisticsData;