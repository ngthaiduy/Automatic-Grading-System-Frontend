import React, { useState } from 'react';
import { getAllUsers } from '../services/adminApi';
import { mapUsersFromApi } from '../components/utils/Utils';

const useGetUsers = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [pageSize, setPageSize] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = async ({
    page = 0,
    size = 8,
    sort = null,
    search = null,
    roleName = null,
  }) => {
    setLoading(true);
    try {
      const res = await getAllUsers({ page, size, sort, search, roleName });
      const pageData = res?.data ?? {};
      const content = Array.isArray(pageData?.content) ? pageData.content : [];
      const currentPage = Number(pageData?.currentPage ?? 0);
      const isLast = Boolean(pageData?.isLast ?? false);
      const pageSize = Number(pageData?.pageSize ?? size);
      const totalItems = Number(pageData?.totalItems ?? 0);
      const totalPages = Number(pageData?.totalPages ?? 0);

      setUsers(mapUsersFromApi(content));
      setCurrentPage(currentPage + 1);
      setIsLast(isLast);
      setPageSize(pageSize);
      setTotalItems(totalItems);
      setTotalPages(totalPages);
      return res;
    } catch (err) {
      setError(err);
      setUsers([]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchUsers,
    loading,
    error,
    users,
    currentPage,
    isLast,
    pageSize,
    totalItems,
    totalPages,
  };
};

export default useGetUsers;
