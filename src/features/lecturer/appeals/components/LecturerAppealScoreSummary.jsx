import React from 'react';
import { formatAppealScore, getScoreDelta } from '../helpers/appealHelpers';

function ScoreCard({ label, value, toneClassName, subtleClassName }) {
  return (
    <div className={`rounded-2xl border p-4 ${subtleClassName}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneClassName}`}>{value}</p>
    </div>
  );
}

export default function LecturerAppealScoreSummary({ originalScore, newScore, testCaseScore, oopScore }) {
  const delta = getScoreDelta(originalScore, newScore);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ScoreCard
        label="Điểm gốc"
        value={formatAppealScore(originalScore)}
        toneClassName="text-slate-900"
        subtleClassName="border-slate-200 bg-slate-50"
      />
      <ScoreCard
        label="Điểm mới"
        value={formatAppealScore(newScore)}
        toneClassName="text-[#F37021]"
        subtleClassName="border-orange-200 bg-orange-50"
      />
      <ScoreCard
        label="Điểm testcase"
        value={formatAppealScore(testCaseScore)}
        toneClassName="text-blue-700"
        subtleClassName="border-blue-200 bg-blue-50"
      />
      <ScoreCard
        label="Điểm OOP"
        value={formatAppealScore(oopScore)}
        toneClassName="text-violet-700"
        subtleClassName="border-violet-200 bg-violet-50"
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 md:col-span-2 xl:col-span-4">
        <p className="text-sm font-medium text-slate-500">Chênh lệch điểm</p>
        <p className={`mt-2 text-3xl font-black ${delta.toneClassName}`}>{delta.label}</p>
      </div>
    </div>
  );
}
