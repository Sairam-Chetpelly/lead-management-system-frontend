'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface Agent {
  _id: string;
  name: string;
  email?: string;
}

interface SearchableAgentDropdownProps {
  agents: Agent[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchableAgentDropdown({
  agents,
  value,
  onChange,
  placeholder = "All Agents"
}: SearchableAgentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const selectedAgent = agents.find(agent => agent._id === value);
  
  const filteredAgents = searchTerm.length >= 3 ? agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.email && agent.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
          (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen, searchTerm]);

  const handleSelect = (agentId: string) => {
    onChange(agentId);
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
            <span className={selectedAgent ? 'text-gray-900' : 'text-gray-500'}>
              {selectedAgent ? selectedAgent.name : placeholder}
            </span>
            <div className="flex items-center space-x-1">
              {selectedAgent && (
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
              ref={triggerRef}
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
              <div className="font-medium text-gray-700">All Agents</div>
              <div className="text-xs text-gray-500">Show leads from all agents</div>
            </div>
            
            {filteredAgents.length > 0 ? (
              filteredAgents.map((agent) => (
                <div
                  key={agent._id}
                  onClick={() => handleSelect(agent._id)}
                  className={`px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-slate-50 ${
                    value === agent._id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900">{agent.name}</div>
                  {agent.email && (
                    <div className="text-xs text-gray-500">{agent.email}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No agents found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}