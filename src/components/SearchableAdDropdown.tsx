'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { authAPI } from '@/lib/auth';

interface SearchableAdDropdownProps {
  field: 'adname' | 'adset' | 'campaign';
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export default function SearchableAdDropdown({
  field,
  value,
  onChange,
  placeholder
}: SearchableAdDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [adValues, setAdValues] = useState<string[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredValues = searchTerm.length >= 3 ? adValues.filter(val =>
    val.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  useEffect(() => {
    const fetchAdValues = async () => {
      try {
        const response = await authAPI.getAdValues(field);
        setAdValues(response.data || []);
      } catch (error) {
        console.error('Error fetching ad values:', error);
        setAdValues([]);
      }
    };

    fetchAdValues();
  }, [field]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isClickOutside = (
        triggerRef.current && !triggerRef.current.contains(target) &&
        inputRef.current && !inputRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      );
      
      if (isClickOutside) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const element = triggerRef.current || inputRef.current;
      if (element) {
        const rect = element.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }
  }, [isOpen, searchTerm]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <>
      <div className="relative">
        {!isOpen ? (
          <div
            ref={triggerRef}
            onClick={() => setIsOpen(!isOpen)}
            className="px-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium cursor-pointer flex items-center justify-between"
          >
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {value || placeholder}
            </span>
            <div className="flex items-center space-x-1">
              {value && (
                <button
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        ) : (
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Type 3+ characters to search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 font-medium"
              autoFocus
            />
          </div>
        )}
      </div>
      {isOpen && searchTerm.length >= 3 && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: Math.max(dropdownPosition.width, 300),
            maxWidth: 400,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="max-h-48 overflow-y-auto overflow-x-hidden">
            <div
              onClick={() => handleSelect('')}
              className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50"
            >
              <div className="font-medium text-gray-700">All {placeholder}</div>
            </div>
            
            {filteredValues.length > 0 ? (
              filteredValues.map((val, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(val)}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 ${
                    value === val ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{val}</div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No {placeholder.toLowerCase()} found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}