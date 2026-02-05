
import React from 'react';
import { MailItem, MailDirection, MailStatus, MailPriority } from '../types';
import { Mail, Send, Clock, CheckCircle, Package, FileArchive } from 'lucide-react';

interface MailItemCardProps {
  mail: MailItem;
  onClick: (mail: MailItem) => void;
}

const MailItemCard: React.FC<MailItemCardProps> = ({ mail, onClick }) => {
  const getStatusIcon = (status: MailStatus) => {
    switch (status) {
      case MailStatus.PENDING: return <Clock size={16} className="text-amber-500" />;
      case MailStatus.RECEIVED: return <CheckCircle size={16} className="text-green-500" />;
      case MailStatus.SENT: return <Package size={16} className="text-blue-500" />;
      case MailStatus.ARCHIVED: return <FileArchive size={16} className="text-teal-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: MailPriority) => {
    switch (priority) {
      case MailPriority.URGENT: return 'bg-red-100 text-red-700';
      case MailPriority.NORMAL: return 'bg-blue-100 text-blue-700';
      case MailPriority.LOW: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      onClick={() => onClick(mail)}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-center group"
    >
      {/* Direction & Ref */}
      <div className="md:col-span-2 flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${mail.direction === MailDirection.INCOMING ? 'bg-indigo-50 text-indigo-600' : 'bg-teal-50 text-teal-600'}`}>
          {mail.direction === MailDirection.INCOMING ? <Mail size={18} /> : <Send size={18} />}
        </div>
        <div className="overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">REF</p>
          <p className="text-xs font-mono font-bold text-gray-700 truncate">{mail.reference || 'N/A'}</p>
        </div>
      </div>

      {/* Subject */}
      <div className="md:col-span-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-gray-900 truncate">{mail.subject}</h3>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${getPriorityColor(mail.priority)}`}>
            {mail.priority}
          </span>
        </div>
        <p className="text-[10px] text-gray-400 font-medium">{mail.date}</p>
      </div>

      {/* Sender/Recipient */}
      <div className="md:col-span-3 overflow-hidden border-l border-gray-50 pl-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
          {mail.direction === MailDirection.INCOMING ? 'EXPÉDITEUR' : 'RÉCEPTEUR'}
        </p>
        <p className="text-sm text-gray-700 font-medium truncate">
          {mail.direction === MailDirection.INCOMING ? mail.sender : mail.recipient}
        </p>
      </div>

      {/* Status */}
      <div className="md:col-span-3 flex items-center justify-end gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
          {getStatusIcon(mail.status)}
          <span className="text-[10px] font-bold text-gray-600 uppercase">
            {mail.status === MailStatus.PENDING ? 'Attente' : mail.status === MailStatus.RECEIVED ? 'Reçu' : mail.status === MailStatus.SENT ? 'Envoyé' : 'Archivé'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MailItemCard;
