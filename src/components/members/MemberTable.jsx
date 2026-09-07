import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, UserCheck, UserX, Eye, Phone, Mail } from 'lucide-react';
import { Button } from '../common/Button';
import { formatDateDisplay } from '../../utils/dateUtils';

export const MemberTable = ({
  members = [],
  isAdmin = true,
  currentMemberId = null,
  onEdit,
  onDeactivate,
  onActivate,
  loading = false,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Member Name</th>
              <th className="py-3.5 px-4">Contact Info</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4">Joined Date</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => {
              const isActive = member.status === 'active';
              const isMe = member.id === currentMemberId;
              const canEditThisMember = isAdmin || isMe;

              return (
                <tr
                  key={member.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-900 font-medium">
                            {member.name} {isMe ? '(You)' : ''}
                          </span>
                          {member.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-normal">
                          ID: {member.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      {member.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.phone}</span>
                        </div>
                      ) : null}
                      {member.email ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{member.email}</span>
                        </div>
                      ) : null}
                      {!member.phone && !member.email && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {formatDateDisplay(member.joinedAt)}
                  </td>

                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/members/${member.id}`)}
                        title="View details and history"
                        icon={Eye}
                      />
                      {canEditThisMember && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(member)}
                          title="Edit profile"
                          icon={Edit2}
                        />
                      )}
                      {isAdmin && (
                        isActive ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDeactivate(member)}
                            title="Deactivate member"
                            icon={UserX}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          />
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onActivate(member)}
                            title="Reactivate member"
                            icon={UserCheck}
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          />
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
