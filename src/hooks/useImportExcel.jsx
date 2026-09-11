import React, { useState } from 'react';
import { importExcel } from '../services/adminApi';

const useImportExcel = () => {
  const [importExcelData, setImportExcelData] = useState();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callImportExcelEndpoint = async (file) => {
    setLoading(true);
    try {
      const res = await importExcel(file);
      console.log(res);
      setImportExcelData(res);
      return res;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { callImportExcelEndpoint, importExcelData, loading, error };
};

export default useImportExcel;
