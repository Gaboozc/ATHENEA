import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addInventoryItem, updateInventoryItem, deleteInventoryItem, transferToProject } from '../store/slices/inventorySlice';
import './Inventory.css';

const CATEGORIES = [
  { value: 'cable', label: 'Cable' },
  { value: 'connector', label: 'Connector' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'tool', label: 'Tool' },
  { value: 'other', label: 'Other' },
];

export const Inventory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.inventory);
  const { projects } = useSelector((state) => state.projects);
  
  const [showModal, setShowModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [transferQty, setTransferQty] = useState(0);
  const [transferProjectId, setTransferProjectId] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'cable',
    quantity: 0,
    unit: 'units',
    location: 'warehouse',
    minStock: 0,
  });
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState('warehouse'); // 'warehouse' or 'project'
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('');

  const warehouseItems = items.filter(i => i.location === 'warehouse');
  const projectItems = items.filter(i => i.location === 'project');
  const filteredProjectItems = selectedProjectFilter
    ? projectItems.filter(i => i.projectId === selectedProjectFilter)
    : projectItems;

  const openAddModal = () => {
    setForm({
      name: '',
      category: 'cable',
      quantity: 0,
      unit: 'units',
      location: viewMode,
      minStock: viewMode === 'warehouse' ? 10 : 0,
      projectId: viewMode === 'project' ? selectedProjectFilter || null : null,
    });
    setEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      location: item.location,
      minStock: item.minStock,
      projectId: item.projectId,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const openTransferModal = (item) => {
    setSelectedItem(item);
    setTransferQty(0);
    setTransferProjectId('');
    setShowTransferModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editMode) {
      dispatch(updateInventoryItem(form));
    } else {
      dispatch(addInventoryItem(form));
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this inventory item?')) {
      dispatch(deleteInventoryItem(id));
    }
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!transferProjectId || transferQty <= 0) return;
    dispatch(transferToProject({
      itemId: selectedItem.id,
      projectId: transferProjectId,
      quantity: parseInt(transferQty),
    }));
    setShowTransferModal(false);
  };

  const getLowStockClass = (item) => {
    if (item.location === 'warehouse' && item.quantity <= item.minStock) {
      return 'low-stock';
    }
    return '';
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h1>Inventory Management</h1>
        <div className="header-actions">
          <select
            className="view-selector"
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              if (e.target.value === 'project' && projects.length > 0) {
                setSelectedProjectFilter(projects[0].id);
              }
            }}
          >
            <option value="warehouse">📦 Warehouse</option>
            <option value="project">🏗️ Project Inventory</option>
          </select>
          <button className="btn-primary" onClick={openAddModal}>
            ➕ Add Item
          </button>
        </div>
      </div>

      {viewMode === 'project' && (
        <div className="project-filter">
          <label>Filter by Project:</label>
          <select
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="inventory-stats">
        <div className="stat-card">
          <h3>{warehouseItems.length}</h3>
          <p>Warehouse Items</p>
        </div>
        <div className="stat-card">
          <h3>{projectItems.length}</h3>
          <p>Project Items</p>
        </div>
        <div className="stat-card">
          <h3>{warehouseItems.filter(i => i.quantity <= i.minStock).length}</h3>
          <p>Low Stock Alerts</p>
        </div>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Unit</th>
            {viewMode === 'project' && <th>Project</th>}
            {viewMode === 'warehouse' && <th>Min Stock</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(viewMode === 'warehouse' ? warehouseItems : filteredProjectItems).map(item => (
            <tr key={item.id} className={getLowStockClass(item)}>
              <td>{item.name}</td>
              <td><span className={`category-badge cat-${item.category}`}>{item.category}</span></td>
              <td><strong>{item.quantity}</strong></td>
              <td>{item.unit}</td>
              {viewMode === 'project' && (
                <td>{projects.find(p => p.id === item.projectId)?.name || 'N/A'}</td>
              )}
              {viewMode === 'warehouse' && <td>{item.minStock}</td>}
              <td>
                <button className="btn-edit" onClick={() => openEditModal(item)}>Edit</button>
                {viewMode === 'warehouse' && (
                  <button className="btn-transfer" onClick={() => openTransferModal(item)}>
                    Transfer
                  </button>
                )}
                <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editMode ? 'Edit Item' : 'Add Inventory Item'}</h2>
            <form onSubmit={handleSubmit} className="inventory-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })}
                    required
                    min="0"
                  />
                </div>
                {form.location === 'warehouse' && (
                  <div className="form-group">
                    <label>Min Stock</label>
                    <input
                      type="number"
                      value={form.minStock}
                      onChange={e => setForm({ ...form, minStock: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Transfer to Project</h2>
            <p><strong>{selectedItem.name}</strong></p>
            <p>Available: {selectedItem.quantity} {selectedItem.unit}</p>
            <form onSubmit={handleTransfer} className="transfer-form">
              <div className="form-group">
                <label>Select Project *</label>
                <select
                  value={transferProjectId}
                  onChange={e => setTransferProjectId(e.target.value)}
                  required
                >
                  <option value="">Choose...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity to Transfer *</label>
                <input
                  type="number"
                  value={transferQty}
                  onChange={e => setTransferQty(e.target.value)}
                  required
                  min="1"
                  max={selectedItem.quantity}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
