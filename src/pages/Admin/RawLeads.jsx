import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AdminNavbar from '../../components/AdminNavbar';
import debounce from 'lodash.debounce';
import {
  FiUploadCloud,
  FiFilter,
  FiChevronUp,
  FiChevronDown,
} from 'react-icons/fi';

const API_BASE = 'https://iitgjobs-backend.onrender.com/api';

const RawLeadManager = () => {
  const { authToken } = useAuth();

  const [file, setFile] = useState(null);
  const [industry, setIndustry] = useState(''); // <-- Added Industry state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [rawLeads, setRawLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [showFilters, setShowFilters] = useState(true);

  const [searchFilters, setSearchFilters] = useState({
    search: '',
    assignedTo: '',
    company: '',
    isComplete: '',
    isLocked: '',
    division: '',
    productLine: '',
    turnOver: '',
    employeeStrength: '',
    location: '',
    from: '',
    to: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [leadSummary, setLeadSummary] = useState({
    total: 0,
    completed: 0,
    incomplete: 0,
  });

  const leadsPerPage = 10;
  const fileInputRef = useRef(null);

  const fetchLeadSummary = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/rawleads/summary`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      setLeadSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch lead summary:', err);
      toast.error('Failed to fetch lead summary');
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/getrawleads`, {
        params: {
          ...searchFilters,
          page: currentPage,
          limit: leadsPerPage,
        },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setRawLeads(res.data.leads || []);
      setTotalLeads(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch raw leads:', err);
      toast.error('Failed to fetch raw leads');
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchLeadSummary();
  }, [currentPage]);

  useEffect(() => {
    const delayFetch = debounce(() => {
      setCurrentPage(1);
      fetchLeads();
    }, 500);
    delayFetch();

    return () => delayFetch.cancel();
  }, [searchFilters]);

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    if (!industry.trim()) return toast.error('Please enter an industry'); // industry required

    const formData = new FormData();
    formData.append('file', file);
    formData.append('industry', industry); // <-- Send industry with file

    setUploading(true);
    setUploadResult(null);

    try {
      const res = await axios.post(`${API_BASE}/admin/leads/bulk/rawlead`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
      });

      setUploadResult(res.data);
      toast.success('Upload complete');
      fetchLeads();
      setFile(null);
      setIndustry(''); // reset
    } catch (err) {
      console.error('[Upload Failed]', err);
      toast.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.ceil(totalLeads / leadsPerPage);

  const resetFilters = () => {
    setSearchFilters({
      search: '',
      assignedTo: '',
      company: '',
      isComplete: '',
      isLocked: '',
      division: '',
      productLine: '',
      turnOver: '',
      employeeStrength: '',
      location: '',
      from: '',
      to: '',
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <AdminNavbar />
      <h1 className="text-3xl font-bold mb-4 text-gray-800 my-13">📊 Raw Leads Panel</h1>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <p className="text-gray-500 text-sm">Total Raw Leads</p>
          <p className="text-2xl font-bold text-gray-800">{leadSummary.total}</p>
        </div>
        <div className="bg-green-100 shadow rounded-xl p-4 text-center">
          <p className="text-green-700 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-800">{leadSummary.completed}</p>
        </div>
        <div className="bg-red-100 shadow rounded-xl p-4 text-center">
          <p className="text-red-700 text-sm">Incomplete</p>
          <p className="text-2xl font-bold text-red-800">{leadSummary.incomplete}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* File Upload */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all"
          >
            <FiUploadCloud className="inline-block mr-2" />
            Choose File
          </button>
        </div>

        {/* Industry Input */}
        <input
          type="text"
          placeholder="Enter Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="border p-2 rounded w-60"
        />

        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        )}

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-all"
        >
          <FiFilter className="inline-block mr-2" />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Reset Filters */}
        <button
          onClick={resetFilters}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-all"
        >
          Show All Leads
        </button>
      </div>

      {/* Upload Status */}
      {uploadResult && (
        <div className="text-sm text-gray-600">
          ✅ Success: <strong>{uploadResult.successCount}</strong> | ❌ Failed:{' '}
          <strong>{uploadResult.failedCount}</strong>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'search', label: 'Search (Name / Email / Designation)' },
              { name: 'division', label: 'Division' },
              { name: 'productLine', label: 'Product Line' },
              { name: 'turnOver', label: 'Turnover' },
              { name: 'employeeStrength', label: 'Employee Strength' },
              { name: 'location', label: 'Location' },
              { name: 'from', label: 'From Date', type: 'date' },
              { name: 'to', label: 'To Date', type: 'date' },
            ].map(({ name, label, type = 'text' }) => (
              <div key={name}>
                <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
                <input
                  type={type}
                  value={searchFilters[name]}
                  onChange={(e) =>
                    setSearchFilters((prev) => ({ ...prev, [name]: e.target.value }))
                  }
                  className="border p-2 w-full rounded"
                />
              </div>
            ))}

            {/* isComplete */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Completion Status</label>
              <select
                value={searchFilters.isComplete}
                onChange={(e) =>
                  setSearchFilters((prev) => ({ ...prev, isComplete: e.target.value }))
                }
                className="border p-2 w-full rounded"
              >
                <option value="">All</option>
                <option value="true">Completed</option>
                <option value="false">Incomplete</option>
              </select>
            </div>

            {/* isLocked */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Lock Status</label>
              <select
                value={searchFilters.isLocked}
                onChange={(e) =>
                  setSearchFilters((prev) => ({ ...prev, isLocked: e.target.value }))
                }
                className="border p-2 w-full rounded"
              >
                <option value="">All</option>
                <option value="true">Locked</option>
                <option value="false">Unlocked</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="overflow-auto border rounded shadow bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {[
                'Name',
                'Designation',
                'Company',
                'Location',
                'Industry',
                'Mobile',
                'Email',
                'Remarks',
                'Division',
                'Product Line',
                'Turnover',
                'Emp. Strength',
                'Lead Generated by',
                'Complete',
              ].map((header) => (
                <th key={header} className="p-2 text-left whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawLeads.length > 0 ? (
              rawLeads.map((lead) => (
                <tr key={lead._id} className="border-t hover:bg-gray-50 transition">
                  <td className="p-2">{lead.name}</td>
                  <td className="p-2">{lead.designation}</td>
                  <td className="p-2">{lead.company?.CompanyName || 'N/A'}</td>
                  <td className="p-2">{lead.location}</td>
                  <td className="p-2">{lead.industry?.name || 'N/A'}</td>
                  <td className="p-2">{lead.mobile?.join(', ')}</td>
                  <td className="p-2">{lead.email}</td>
                  <td className="p-2">{lead.remarks}</td>
                  <td className="p-2">{lead.division}</td>
                  <td className="p-2">{lead.productLine}</td>
                  <td className="p-2">{lead.turnOver}</td>
                  <td className="p-2">{lead.employeeStrength}</td>
                  <td className="p-2">{lead.assignedTo?.name || '-'}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.isComplete
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {lead.isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className="p-4 text-center text-gray-500">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {rawLeads.length} of {totalLeads} leads
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="self-center text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RawLeadManager;
