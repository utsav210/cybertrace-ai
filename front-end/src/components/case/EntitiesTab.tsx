import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Pencil, Save, Filter, ShieldCheck, Phone, Mail, Wallet, Building, CreditCard, User } from 'lucide-react';
import { useCaseStore } from '../../store/caseStore';
import type { Entity } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Props { caseId: string }

const ENTITY_TYPE_ICONS: Record<Entity['type'], React.ReactNode> = {
  phone: <Phone size={13} className="text-blue-400" />,
  email: <Mail size={13} className="text-purple-400" />,
  upi: <Wallet size={13} className="text-green-400" />,
  ifsc: <Building size={13} className="text-amber-400" />,
  account: <CreditCard size={13} className="text-cyan-400" />,
  person: <User size={13} className="text-pink-400" />,
  url: <span className="text-xs text-orange-400">URL</span>,
};

const ENTITY_TYPE_LABELS: Record<Entity['type'], string> = {
  phone: 'Phone',
  email: 'Email',
  upi: 'UPI ID',
  ifsc: 'IFSC',
  account: 'Account No.',
  person: 'Person',
  url: 'URL',
};

export const EntitiesTab: React.FC<Props> = ({ caseId }) => {
  const { t } = useTranslation();
  const { entities, acceptEntity, rejectEntity, editEntity } = useCaseStore();
  const [filterType, setFilterType] = useState<Entity['type'] | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const caseEntities = entities.filter((e) => e.caseId === caseId);
  const filtered = filterType === 'all' ? caseEntities : caseEntities.filter((e) => e.type === filterType);

  const confidenceColor = (c: number) => {
    if (c >= 0.95) return 'text-green-400';
    if (c >= 0.85) return 'text-amber-400';
    return 'text-red-400';
  };

  const confidenceBg = (c: number) => {
    if (c >= 0.95) return 'rgba(16,185,129,0.15)';
    if (c >= 0.85) return 'rgba(245,158,11,0.15)';
    return 'rgba(220,38,38,0.15)';
  };

  const startEdit = (entity: Entity) => {
    setEditingId(entity.id);
    setEditValue(entity.value);
  };

  const saveEdit = (id: string) => {
    editEntity(id, editValue);
    setEditingId(null);
  };

  const uniqueTypes = [...new Set(caseEntities.map((e) => e.type))];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-white/40" />
        <span className="text-xs text-white/40">{t('entities.filterByType')}:</span>
        {(['all', ...uniqueTypes] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              filterType === type
                ? 'text-amber-400 border border-amber-400/40'
                : 'text-white/40 hover:text-white/70 border border-white/10'
            )}
            style={{ background: filterType === type ? 'rgba(245,158,11,0.1)' : 'transparent' }}
          >
            {type === 'all' ? t('entities.all') : ENTITY_TYPE_LABELS[type]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3 text-xs text-white/30">
          <span>{filtered.length} entities</span>
          <span className="text-green-400">{filtered.filter((e) => e.status === 'accepted').length} accepted</span>
          <span className="text-red-400">{filtered.filter((e) => e.status === 'rejected').length} rejected</span>
        </div>
      </div>

      {/* Entities Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('entities.type')}</th>
                <th>{t('entities.value')}</th>
                <th>{t('entities.confidence')}</th>
                <th>{t('entities.source')}</th>
                <th>{t('entities.status')}</th>
                <th>{t('entities.actions')}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((entity) => (
                  <motion.tr
                    key={entity.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={clsx(
                      entity.status === 'accepted' && 'bg-green-500/5',
                      entity.status === 'rejected' && 'bg-red-500/5 opacity-60'
                    )}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        {ENTITY_TYPE_ICONS[entity.type]}
                        <span className="text-xs font-medium text-white/70">{ENTITY_TYPE_LABELS[entity.type]}</span>
                      </div>
                    </td>
                    <td>
                      {editingId === entity.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEdit(entity.id)}
                          className="form-input text-sm py-1 px-2 w-full"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{entity.value}</span>
                          {entity.status === 'accepted' && (
                            <span className="flex items-center gap-1 text-xs text-green-400 px-1.5 py-0.5 rounded-full border border-green-400/30"
                              style={{ background: 'rgba(16,185,129,0.1)' }}>
                              <ShieldCheck size={10} /> Verified
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${confidenceColor(entity.confidence)}`}>
                          {(entity.confidence * 100).toFixed(0)}%
                        </span>
                        <div className="w-16 risk-bar-wrapper">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${entity.confidence * 100}%`,
                              background: `linear-gradient(90deg, ${entity.confidence >= 0.95 ? '#10B981' : entity.confidence >= 0.85 ? '#F59E0B' : '#DC2626'}, transparent)`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                        {entity.source}
                      </span>
                    </td>
                    <td>
                      {entity.status === 'pending' && (
                        <span className="text-xs text-white/40">{t('entities.pending')}</span>
                      )}
                      {entity.status === 'accepted' && (
                        <span className="text-xs text-green-400 font-medium">{t('entities.verified')}</span>
                      )}
                      {entity.status === 'rejected' && (
                        <span className="text-xs text-red-400 font-medium">{t('entities.rejected')}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {editingId === entity.id ? (
                          <>
                            <button onClick={() => saveEdit(entity.id)} className="btn-success">
                              <Save size={11} /> {t('entities.save')}
                            </button>
                            <button onClick={() => setEditingId(null)} className="btn-danger">
                              <X size={11} />
                            </button>
                          </>
                        ) : (
                          <>
                            {entity.status !== 'accepted' && (
                              <button onClick={() => acceptEntity(entity.id)} className="btn-success">
                                <Check size={11} /> {t('entities.accept')}
                              </button>
                            )}
                            {entity.status !== 'rejected' && (
                              <button onClick={() => rejectEntity(entity.id)} className="btn-danger">
                                <X size={11} /> {t('entities.reject')}
                              </button>
                            )}
                            <button onClick={() => startEdit(entity)} className="btn-info">
                              <Pencil size={11} /> {t('entities.edit')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
