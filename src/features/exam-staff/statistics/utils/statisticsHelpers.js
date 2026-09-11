const DEFAULT_SCORE = '0.00';

export const unwrapApiData = (payload) => payload?.data ?? payload ?? null;

export const ensureArray = (value) => (Array.isArray(value) ? value : []);

export const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const formatScore = (value, digits = 2) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return DEFAULT_SCORE;
  return num.toFixed(digits);
};

export const formatPercent = (value, digits = 1) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return `0.${'0'.repeat(digits)}%`;
  return `${num.toFixed(digits)}%`;
};

export const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0 ₫';
  return `${num.toLocaleString('vi-VN')} ₫`;
};

export const buildMetricCards = (statistics) => {
  const scoreAnalysis = statistics?.scoreAnalysis ?? {};
  const aiOopAnalysis = statistics?.aiOopAnalysis ?? {};
  const appealFinancial = statistics?.appealFinancial ?? {};

  const totalSubmissions = toNumber(statistics?.totalSubmissions);

  return [
    {
      key: 'submitted',
      title: 'Đã nộp bài',
      value: totalSubmissions.toLocaleString('vi-VN'),
      helper: 'Tổng số submission trong block',
      icon: 'upload_file',
      accent: 'text-orange-500',
    },
    {
      key: 'average',
      title: 'Điểm trung bình',
      value: formatScore(scoreAnalysis?.avgScore),
      helper: `Max: ${formatScore(scoreAnalysis?.maxScore)} • Min: ${formatScore(scoreAnalysis?.minScore)}`,
      icon: 'analytics',
      accent: 'text-violet-500',
    },
    {
      key: 'passRate',
      title: 'Tỷ lệ pass',
      value: formatPercent(scoreAnalysis?.passRate),
      helper: `${toNumber(scoreAnalysis?.passCount).toLocaleString('vi-VN')} bài đạt`,
      icon: 'emoji_events',
      accent: 'text-lime-500',
    },
    {
      key: 'failRate',
      title: 'Tỷ lệ fail',
      value: formatPercent(scoreAnalysis?.failRate),
      helper: `${toNumber(scoreAnalysis?.failCount).toLocaleString('vi-VN')} bài chưa đạt`,
      icon: 'gpp_bad',
      accent: 'text-rose-500',
    },
    {
      key: 'oopAverage',
      title: 'Điểm OOP TB',
      value: formatScore(aiOopAnalysis?.avgOopScore),
      helper: `Vi phạm OOP: ${formatPercent(aiOopAnalysis?.oopViolatedRate)}`,
      icon: 'account_tree',
      accent: 'text-amber-500',
    },
    {
      key: 'appeals',
      title: 'Đơn phúc khảo',
      value: toNumber(appealFinancial?.totalAppeals).toLocaleString('vi-VN'),
      helper: `${toNumber(appealFinancial?.approvedCount).toLocaleString('vi-VN')} đã duyệt • ${toNumber(appealFinancial?.deniedCount).toLocaleString('vi-VN')} từ chối`,
      icon: 'gavel',
      accent: 'text-sky-500',
    },
    {
      key: 'feesCollected',
      title: 'Phí phúc khảo thu được',
      value: formatCurrency(appealFinancial?.totalFeesCollected),
      helper: 'Tổng tiền thu từ các đơn đã thanh toán',
      icon: 'payments',
      accent: 'text-emerald-500',
    },
    {
      key: 'refunded',
      title: 'Tiền hoàn cho sinh viên',
      value: formatCurrency(appealFinancial?.totalRefunded),
      helper: 'Tổng tiền hoàn ở các đơn được duyệt',
      icon: 'undo',
      accent: 'text-cyan-500',
    },
  ];
};

export const normalizeDistribution = (distribution) => {
  const items = ensureArray(distribution).map((item) => ({
    range: item?.range ?? item?.label ?? '—',
    count: toNumber(item?.count),
    percentage: toNumber(item?.percentage),
  }));

  const maxCount = items.reduce((highest, item) => Math.max(highest, item.count), 0);

  return items.map((item) => ({
    ...item,
    heightPercent: maxCount > 0 ? (item.count / maxCount) * 100 : 0,
  }));
};

export const buildPassFailSummary = (statistics) => {
  const scoreAnalysis = statistics?.scoreAnalysis ?? {};
  return {
    passCount: toNumber(scoreAnalysis?.passCount),
    failCount: toNumber(scoreAnalysis?.failCount),
    passRate: toNumber(scoreAnalysis?.passRate),
    failRate: toNumber(scoreAnalysis?.failRate),
    gradedSubmissions: toNumber(statistics?.gradedSubmissions),
  };
};

export const buildAiOverviewSummary = (statistics) => {
  const aiOopAnalysis = statistics?.aiOopAnalysis ?? {};

  return {
    avgOopScore: toNumber(aiOopAnalysis?.avgOopScore),
    oopViolatedCount: toNumber(aiOopAnalysis?.oopViolatedCount),
    oopViolatedRate: toNumber(aiOopAnalysis?.oopViolatedRate),
    hardCodeCount: toNumber(aiOopAnalysis?.hardCodeCount),
    hardCodeRate: toNumber(aiOopAnalysis?.hardCodeRate),
  };
};

export const buildOopViolationItems = (statistics) => {
  const aiOopAnalysis = statistics?.aiOopAnalysis ?? {};

  // Luôn hiển thị 3 nhóm cố định từ deterministic grading
  const fixedGroups = [
    {
      key: 'encap',
      label: 'Encapsulation',
      fullLabel: 'Encapsulation (FIELD_CHECK, GETTER_SETTER)',
      count: toNumber(aiOopAnalysis?.encapsulationViolations),
      rate: toNumber(aiOopAnalysis?.encapsulationViolationRate),
    },
    {
      key: 'inherit',
      label: 'Inheritance',
      fullLabel: 'Inheritance (EXTENDS_CHECK, IMPLEMENTS_CHECK, CLASS_EXISTS, INTERFACE_EXISTS)',
      count: toNumber(aiOopAnalysis?.inheritanceViolations),
      rate: toNumber(aiOopAnalysis?.inheritanceViolationRate),
    },
    {
      key: 'poly',
      label: 'Polymorphism',
      fullLabel: 'Polymorphism (METHOD_SIGNATURE, CONSTRUCTOR_CHECK, NAMING_CONVENTION)',
      count: toNumber(aiOopAnalysis?.polymorphismViolations),
      rate: toNumber(aiOopAnalysis?.polymorphismViolationRate),
    },
  ];

  // Nếu tổng các nhóm > 0 thì có data, dùng fixedGroups
  const hasGroupData = fixedGroups.some(g => g.count > 0 || g.rate > 0);
  if (hasGroupData) {
    return fixedGroups;
  }

  // Fallback: thử đọc từ criteriaStats nếu nhóm đều = 0
  const dynamicCriteriaSource =
    aiOopAnalysis?.criteriaStats
    ?? aiOopAnalysis?.criteria_stats
    ?? aiOopAnalysis?.criteria
    ?? aiOopAnalysis?.criteriaBreakdown
    ?? aiOopAnalysis?.criteria_breakdown;

  const rawCriteriaItems = Array.isArray(dynamicCriteriaSource)
    ? dynamicCriteriaSource
    : (dynamicCriteriaSource && typeof dynamicCriteriaSource === 'object')
      ? Object.entries(dynamicCriteriaSource).map(([name, value]) => ({
        ...(value && typeof value === 'object' ? value : {}),
        name: value?.name ?? name,
      }))
      : [];

  const dynamicCriteria = rawCriteriaItems
    .map((item, index) => {
      const name = String(
        item?.name ?? item?.criterionName ?? item?.criterion ?? item?.label ?? '',
      ).trim();
      if (!name) return null;
      const shortLabel = name.length > 16 ? `${name.slice(0, 16)}…` : name;
      return {
        key: `dynamic-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        label: shortLabel,
        fullLabel: name,
        count: toNumber(item?.violationCount ?? item?.violatedCount ?? item?.count),
        rate: toNumber(item?.violationRate ?? item?.violatedRate ?? item?.rate),
        avgScore: toNumber(item?.avgScore ?? item?.averageScore),
        sampleSize: toNumber(item?.sampleSize ?? item?.evaluatedCount),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);

  return dynamicCriteria.length > 0 ? dynamicCriteria : fixedGroups;
};

/**
 * Trích xuất criteriaStats[] để hiển thị bảng chi tiết.
 */
export const buildCriteriaStats = (statistics) => {
  const source = statistics?.aiOopAnalysis?.criteriaStats
    ?? statistics?.aiOopAnalysis?.criteria_stats
    ?? [];
  if (!Array.isArray(source)) return [];
  return source.map((item, index) => ({
    name: item?.name ?? `Tiêu chí ${index + 1}`,
    avgScore: toNumber(item?.avgScore ?? item?.averageScore),
    violationCount: toNumber(item?.violationCount ?? item?.violatedCount ?? item?.count),
    violationRate: toNumber(item?.violationRate ?? item?.violatedRate ?? item?.rate),
    sampleSize: toNumber(item?.sampleSize ?? item?.evaluatedCount),
  }));
};

export const buildAppealStatusItems = (statistics) => {
  const appealFinancial = statistics?.appealFinancial ?? {};

  return [
    {
      key: 'pending',
      label: 'Chờ phân công',
      count: toNumber(appealFinancial?.pendingCount),
    },
    {
      key: 'processing',
      label: 'Đã phân công',
      count: toNumber(appealFinancial?.processingCount),
    },
    {
      key: 'approved',
      label: 'Đã duyệt',
      count: toNumber(appealFinancial?.approvedCount),
    },
    {
      key: 'denied',
      label: 'Từ chối',
      count: toNumber(appealFinancial?.deniedCount),
    },
  ];
};

export const buildAppealFinanceCards = (statistics) => {
  const appealFinancial = statistics?.appealFinancial ?? {};

  return [
    {
      key: 'feesCollected',
      title: 'Tổng phí thu được',
      value: toNumber(appealFinancial?.totalFeesCollected),
      icon: 'payments',
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    {
      key: 'refunded',
      title: 'Tiền hoàn cho sinh viên',
      value: toNumber(appealFinancial?.totalRefunded),
      icon: 'undo',
      accent: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
    },
    {
      key: 'netRevenue',
      title: 'Doanh thu ròng',
      value: toNumber(appealFinancial?.netRevenue),
      icon: 'account_balance_wallet',
      accent: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-200',
    },
  ];
};

export const buildComparisonRows = (blocks, comparisonData) => {
  const blockList = ensureArray(blocks);
  const dataMap = comparisonData instanceof Map ? comparisonData : new Map();

  return blockList.map((block) => {
    const item = dataMap.get(block?.blockId) ?? {};
    const stats = item.statistics ?? {};
    const totalSubmissions = toNumber(stats?.totalSubmissions);
    const gradedSubmissions = toNumber(stats?.gradedSubmissions);

    return {
      blockId: block?.blockId,
      blockName: block?.name || 'Block',
      totalSubmissions,
      gradedSubmissions,
      gradingRate: totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0,
      averageScore: toNumber(stats?.scoreAnalysis?.avgScore),
      passRate: toNumber(stats?.scoreAnalysis?.passRate),
      avgOopScore: toNumber(stats?.aiOopAnalysis?.avgOopScore),
      totalAppeals: toNumber(stats?.appealFinancial?.totalAppeals),
      comparisonReady: Boolean(item.statistics),
    };
  });
};

export const getBlockDisplayName = (block, exam) => {
  const blockName = block?.name || 'Block';
  const examName = exam?.name || 'Kỳ thi';
  return `${blockName} — ${examName}`;
};

export const buildTestCaseStats = (statistics) => {
  const rawList = ensureArray(statistics?.testCaseStats);
  return rawList.map((tc, index) => {
    const failureRate = toNumber(tc.failureRate);
    
    let severity = 'success';
    let severityLabel = 'Thấp';
    if (failureRate >= 75) {
      severity = 'error';
      severityLabel = 'Nghiêm trọng';
    } else if (failureRate >= 40) {
      severity = 'warning';
      severityLabel = 'Trung bình';
    } else if (failureRate > 0) {
      severity = 'info';
      severityLabel = 'Nhẹ';
    }

    return {
      id: index + 1,
      name: tc.name || 'Test Case',
      avgScore: toNumber(tc.avgScore),
      failureCount: toNumber(tc.failureCount),
      failureRate,
      sampleSize: toNumber(tc.sampleSize),
      severity,
      severityLabel,
    };
  });
};
