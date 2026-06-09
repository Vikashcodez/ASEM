import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Target, 
  Users, 
  FileText, 
  CheckCircle, 
  Calendar,
  Hash,
  Save,
  RotateCcw,
  Download,
  Share2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const PostIncidentReviewForm = () => {
  const [expandedSections, setExpandedSections] = useState({
    rca: true,
    review: true,
    actions: true,
    summary: true
  });

  const [formData, setFormData] = useState({
    incidentId: '',
    incidentTitle: '',
    incidentDate: '',
    severity: 'P2',
    duration: '',
    rootCause: '',
    contributingFactors: ['', '', ''],
    impactAnalysis: '',
    timeline: [{ time: '', event: '' }],
    detectionIssues: '',
    responseIssues: '',
    communicationIssues: '',
    whatWentWell: ['', '', ''],
    whatWentWrong: ['', '', ''],
    actionItems: [{ action: '', owner: '', dueDate: '', status: 'pending' }],
    summary: '',
    lessonsLearned: '',
    recommendations: ''
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };

  const handleTimelineChange = (index, field, value) => {
    const newTimeline = [...formData.timeline];
    newTimeline[index] = { ...newTimeline[index], [field]: value };
    handleInputChange('timeline', newTimeline);
  };

  const addTimelineEntry = () => {
    setFormData(prev => ({
      ...prev,
      timeline: [...prev.timeline, { time: '', event: '' }]
    }));
  };

  const handleActionItemChange = (index, field, value) => {
    const newActions = [...formData.actionItems];
    newActions[index] = { ...newActions[index], [field]: value };
    handleInputChange('actionItems', newActions);
  };

  const addActionItem = () => {
    setFormData(prev => ({
      ...prev,
      actionItems: [...prev.actionItems, { action: '', owner: '', dueDate: '', status: 'pending' }]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Post-Incident Review submitted successfully!');
  };

  const resetForm = () => {
    setFormData({
      incidentId: '',
      incidentTitle: '',
      incidentDate: '',
      severity: 'P2',
      duration: '',
      rootCause: '',
      contributingFactors: ['', '', ''],
      impactAnalysis: '',
      timeline: [{ time: '', event: '' }],
      detectionIssues: '',
      responseIssues: '',
      communicationIssues: '',
      whatWentWell: ['', '', ''],
      whatWentWrong: ['', '', ''],
      actionItems: [{ action: '', owner: '', dueDate: '', status: 'pending' }],
      summary: '',
      lessonsLearned: '',
      recommendations: ''
    });
  };

  const SectionHeader = ({ title, icon: Icon, section, description }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-6 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-black rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
          <h2 className="text-xl font-semibold text-black">{title}</h2>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronDown className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );

  const InputField = ({ label, value, onChange, placeholder, type = "text", required = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none bg-white text-black"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none bg-white text-black"
        />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl border border-gray-200 mb-6">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-black rounded-xl">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">Post-Incident RCA & Review</h1>
                  <p className="text-gray-500 mt-1">Root Cause Analysis & Systematic Review for Continuous Improvement</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-black">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-black">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Incident Metadata */}
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                <Hash className="w-3 h-3" /> <span>Incident ID</span>
              </label>
              <input
                type="text"
                value={formData.incidentId}
                onChange={(e) => handleInputChange('incidentId', e.target.value)}
                placeholder="INC-2024-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-3 h-3" /> <span>Severity</span>
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              >
                <option value="P0">P0 - Critical</option>
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Medium</option>
                <option value="P3">P3 - Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                <Calendar className="w-3 h-3" /> <span>Date</span>
              </label>
              <input
                type="date"
                value={formData.incidentDate}
                onChange={(e) => handleInputChange('incidentDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-3 h-3" /> <span>Duration (hours)</span>
              </label>
              <input
                type="text"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
                placeholder="2.5 hours"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              />
            </div>
          </div>
        </div>

        {/* RCA Section */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          <SectionHeader title="Root Cause Analysis" icon={Target} section="rca" description="Identify the underlying causes and contributing factors" />
          {expandedSections.rca && (
            <div className="p-8 space-y-6">
              <InputField
                label="Root Cause"
                value={formData.rootCause}
                onChange={(val) => handleInputChange('rootCause', val)}
                placeholder="What was the primary root cause of this incident?"
                type="textarea"
                required
              />
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Contributing Factors</label>
                {formData.contributingFactors.map((factor, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={factor}
                    onChange={(e) => handleArrayChange('contributingFactors', idx, e.target.value)}
                    placeholder={`Factor ${idx + 1}`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                  />
                ))}
              </div>

              <InputField
                label="Impact Analysis"
                value={formData.impactAnalysis}
                onChange={(val) => handleInputChange('impactAnalysis', val)}
                placeholder="Describe the business and technical impact"
                type="textarea"
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Incident Timeline</label>
                {formData.timeline.map((entry, idx) => (
                  <div key={idx} className="flex space-x-3">
                    <input
                      type="text"
                      value={entry.time}
                      onChange={(e) => handleTimelineChange(idx, 'time', e.target.value)}
                      placeholder="Time (e.g., 14:30 UTC)"
                      className="w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                    <input
                      type="text"
                      value={entry.event}
                      onChange={(e) => handleTimelineChange(idx, 'event', e.target.value)}
                      placeholder="Event description"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimelineEntry}
                  className="text-sm text-gray-600 hover:text-black transition-colors flex items-center space-x-1"
                >
                  + Add timeline entry
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Review Section */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          <SectionHeader title="Post-Incident Review" icon={FileText} section="review" description="Evaluate detection, response, and communication" />
          {expandedSections.review && (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Detection Issues"
                  value={formData.detectionIssues}
                  onChange={(val) => handleInputChange('detectionIssues', val)}
                  placeholder="How could detection have been faster?"
                  type="textarea"
                />
                <InputField
                  label="Response Issues"
                  value={formData.responseIssues}
                  onChange={(val) => handleInputChange('responseIssues', val)}
                  placeholder="What slowed down the response?"
                  type="textarea"
                />
              </div>
              
              <InputField
                label="Communication Gaps"
                value={formData.communicationIssues}
                onChange={(val) => handleInputChange('communicationIssues', val)}
                placeholder="Were there any communication breakdowns?"
                type="textarea"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-green-700">What Went Well</label>
                  {formData.whatWentWell.map((item, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('whatWentWell', idx, e.target.value)}
                      placeholder={`Success ${idx + 1}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                  ))}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-red-700">What Went Wrong</label>
                  {formData.whatWentWrong.map((item, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange('whatWentWrong', idx, e.target.value)}
                      placeholder={`Failure ${idx + 1}`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Items Section */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          <SectionHeader title="Action Items" icon={CheckCircle} section="actions" description="Track improvements and preventive measures" />
          {expandedSections.actions && (
            <div className="p-8 space-y-4">
              {formData.actionItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="text"
                    value={item.action}
                    onChange={(e) => handleActionItemChange(idx, 'action', e.target.value)}
                    placeholder="Action item"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  />
                  <input
                    type="text"
                    value={item.owner}
                    onChange={(e) => handleActionItemChange(idx, 'owner', e.target.value)}
                    placeholder="Owner"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  />
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => handleActionItemChange(idx, 'dueDate', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  />
                  <select
                    value={item.status}
                    onChange={(e) => handleActionItemChange(idx, 'status', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              ))}
              <button
                type="button"
                onClick={addActionItem}
                className="text-sm text-gray-600 hover:text-black transition-colors flex items-center space-x-1"
              >
                + Add action item
              </button>
            </div>
          )}
        </div>

        {/* Final Summary Section */}
        <div className="bg-white rounded-2xl border border-gray-200 mb-6 overflow-hidden">
          <SectionHeader title="Final Summary & Learnings" icon={Users} section="summary" description="Capture lessons learned and recommendations" />
          {expandedSections.summary && (
            <div className="p-8 space-y-6">
              <InputField
                label="Executive Summary"
                value={formData.summary}
                onChange={(val) => handleInputChange('summary', val)}
                placeholder="Brief summary of the incident and key findings"
                type="textarea"
              />
              <InputField
                label="Lessons Learned"
                value={formData.lessonsLearned}
                onChange={(val) => handleInputChange('lessonsLearned', val)}
                placeholder="What did we learn from this incident?"
                type="textarea"
              />
              <InputField
                label="Recommendations"
                value={formData.recommendations}
                onChange={(val) => handleInputChange('recommendations', val)}
                placeholder="Strategic recommendations for the platform"
                type="textarea"
              />
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 pb-12">
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-black"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Submit Review</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostIncidentReviewForm;