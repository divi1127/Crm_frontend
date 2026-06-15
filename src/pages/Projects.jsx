import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit, Trash2, X, Link as LinkIcon, 
  ExternalLink, Briefcase, FileText, CheckCircle2, 
  Clock, AlertCircle, Building, Download
} from 'lucide-react';
import api from '../utils/api';
import { exportToExcel } from '../utils/exportToExcel';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    projectLink: '', 
    status: 'In Progress', 
    clientId: '' 
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.role === 'Admin') {
      setIsAdmin(true);
    }
    fetchData(userInfo);
  }, []);

  const fetchData = async (userInfo) => {
    try {
      const config = userInfo ? { headers: { Authorization: `Bearer ${userInfo.token}` } } : {};
      
      // Fetch both projects and clients concurrently
      const [projectsRes, clientsRes] = await Promise.all([
        api.get('/api/projects', config),
        api.get('/api/clients', config)
      ]);
      
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
    } catch (error) {
      console.error('Error fetching projects or clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      // Parse clientId as number or null if empty
      const payload = {
        ...formData,
        clientId: formData.clientId ? Number(formData.clientId) : null
      };

      if (isEdit) {
        const { data } = await api.put(`/api/projects/${editId}`, payload, config);
        setProjects(projects.map(p => p.id === editId ? data : p));
      } else {
        const { data } = await api.post('/api/projects', payload, config);
        setProjects([data, ...projects]);
      }
      
      setShowModal(false);
      setFormData({ 
        name: '', 
        description: '', 
        projectLink: '', 
        status: 'In Progress', 
        clientId: '' 
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving project data.');
    }
  };

  const handleEditClick = (project) => {
    setIsEdit(true);
    setEditId(project.id);
    setFormData({
      name: project.name || '',
      description: project.description || '',
      projectLink: project.projectLink || '',
      status: project.status || 'In Progress',
      clientId: project.clientId ? String(project.clientId) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await api.delete(`/api/projects/${id}`, config);
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete project.');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'In Progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'On Hold': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Completed': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'In Progress': return <Clock className="w-3.5 h-3.5" />;
      case 'On Hold': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'Completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
      default: return <Briefcase className="w-3.5 h-3.5" />;
    }
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (project.client && project.client.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (project.client && project.client.company && project.client.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Project Portfolio</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Organize projects, link repositories/URLs, and associate records with clients.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToExcel(projects, 'Projects_Data')} 
            className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          {isAdmin && (
            <button 
              onClick={() => { 
                setIsEdit(false); 
                setFormData({ 
                  name: '', 
                  description: '', 
                  projectLink: '', 
                  status: 'In Progress', 
                  clientId: '' 
                }); 
                setShowModal(true); 
              }} 
              className="flex items-center px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Project
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" />
          <input 
            type="text" 
            placeholder="Search projects, client names, or details..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--color-accent)]" 
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white py-10">Loading portfolio...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center text-[var(--color-text-secondary)] py-10 glass-card">No projects found. Create a project to start planning.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div 
              key={project.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)]/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1 tracking-tight truncate max-w-[200px]" title={project.name}>
                      {project.name}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border uppercase tracking-wider ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      <span className="ml-0.5">{project.status}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => handleEditClick(project)} 
                          className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-colors cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(project.id)} 
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed mb-4 min-h-[60px]">
                  {project.description || 'No project description added.'}
                </p>

                {/* Dynamic Linked Client Badge */}
                {project.client ? (
                  <div className="flex items-center gap-2 p-2.5 bg-white/3 border border-[var(--color-border)]/20 rounded-xl mb-4">
                    <Building className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" />
                    <div className="overflow-hidden text-xs">
                      <p className="text-[var(--color-text-secondary)] font-medium truncate">Client: <span className="text-white font-bold">{project.client.name}</span></p>
                      {project.client.company && (
                        <p className="text-[var(--color-text-secondary)] opacity-70 truncate font-semibold">{project.client.company}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 bg-white/1 border border-dashed border-[var(--color-border)]/20 rounded-xl mb-4">
                    <Building className="w-4 h-4 text-[var(--color-text-secondary)] opacity-40 flex-shrink-0" />
                    <span className="text-xs text-[var(--color-text-secondary)] opacity-60">No linked client</span>
                  </div>
                )}
              </div>

              {/* Action Link Footer */}
              {project.projectLink && (
                <div className="pt-3 border-t border-[var(--color-border)]/40 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Repo / Site Link</span>
                  <a 
                    href={project.projectLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] text-xs font-semibold rounded-lg border border-[var(--color-accent)]/25 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Launch Link</span>
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="glass-card w-full max-w-lg p-6 relative"
            >
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Project Profile' : 'Create New Project'}</h2>
              
              <form onSubmit={handleSaveProject} className="space-y-4">
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Project Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" 
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Description (Project Details)</label>
                  <textarea 
                    rows="3" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    placeholder="Briefly describe the project goals..."
                  ></textarea>
                </div>

                <div>
                  <label className="text-sm text-[var(--color-text-secondary)]">Link URL (GitHub / Demo Link)</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2"><LinkIcon className="w-4 h-4 text-[var(--color-text-secondary)]" /></span>
                    <input 
                      type="url" 
                      value={formData.projectLink} 
                      onChange={e => setFormData({...formData, projectLink: e.target.value})} 
                      className="w-full pl-9 pr-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]" 
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Project Status</label>
                    <select 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="In Progress" className="bg-[#1E293B] text-white">In Progress</option>
                      <option value="On Hold" className="bg-[#1E293B] text-white">On Hold</option>
                      <option value="Completed" className="bg-[#1E293B] text-white">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-[var(--color-text-secondary)]">Link with Client</label>
                    <select 
                      value={formData.clientId} 
                      onChange={e => setFormData({...formData, clientId: e.target.value})} 
                      className="w-full mt-1 px-3 py-2 bg-[var(--color-primary-bg)] border border-[var(--color-border)] rounded-lg text-white outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="" className="bg-[#1E293B] text-white">No Associated Client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id} className="bg-[#1E293B] text-white">
                          {client.company ? `${client.company} (${client.name})` : client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 bg-[var(--color-primary-bg)] text-white font-medium rounded-lg border border-[var(--color-border)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    {isEdit ? 'Update Project' : 'Save Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
