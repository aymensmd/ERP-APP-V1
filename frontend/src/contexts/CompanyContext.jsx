import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';
import { message } from 'antd';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  const [currentCompany, setCurrentCompany] = useState(() => {
    const saved = localStorage.getItem('current_company');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's companies
  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/companies/my');
      const companiesData = Array.isArray(response.data) ? response.data : [];
      setCompanies(companiesData);
      
      // If no current company is set, use the first one
      if (!currentCompany && companiesData.length > 0) {
        const firstCompany = companiesData[0];
        setCurrentCompany(firstCompany);
        localStorage.setItem('current_company_id', firstCompany.id.toString());
        localStorage.setItem('current_company', JSON.stringify(firstCompany));
      }
      
      return companiesData;
    } catch (error) {
      console.error('Error loading companies:', error);
      message.error('Failed to load companies');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Switch to a different company
  const switchCompany = async (companyId) => {
    try {
      setLoading(true);
      await axios.post(`/companies/${companyId}/switch`);
      
      const company = companies.find(c => c.id === companyId || c.id === parseInt(companyId));
      if (company) {
        setCurrentCompany(company);
        localStorage.setItem('current_company_id', company.id.toString());
        localStorage.setItem('current_company', JSON.stringify(company));
        message.success(`Switched to ${company.name}`);
        
        // Reload page to apply company scope to all queries
        window.location.reload();
      } else {
        // If company not in list, reload companies first
        await loadCompanies();
        const updatedCompany = companies.find(c => c.id === companyId || c.id === parseInt(companyId));
        if (updatedCompany) {
          setCurrentCompany(updatedCompany);
          localStorage.setItem('current_company_id', updatedCompany.id.toString());
          localStorage.setItem('current_company', JSON.stringify(updatedCompany));
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error switching company:', error);
      message.error('Failed to switch company');
    } finally {
      setLoading(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (token) {
      loadCompanies();
    }
  }, []);

  // Restore company from localStorage on mount
  useEffect(() => {
    const savedCompanyId = localStorage.getItem('current_company_id');
    if (savedCompanyId && !currentCompany) {
      // Try to find company in loaded list
      const company = companies.find(c => c.id === parseInt(savedCompanyId));
      if (company) {
        setCurrentCompany(company);
      }
    }
  }, [companies]);

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        loading,
        loadCompanies,
        switchCompany,
        setCurrentCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};




