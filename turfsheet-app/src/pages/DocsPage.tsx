import { FileText } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="pb-6 border-b border-border-color">
        <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
          Documents
        </h2>
        <p className="text-text-secondary text-sm font-sans mt-1">
          Access SOPs, manuals, and reference documents.
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white border border-border-color p-16 text-center shadow-sm max-w-lg w-full">
          <div className="w-20 h-20 bg-turf-green/5 flex items-center justify-center mb-6 border border-turf-green/10 mx-auto">
            <FileText className="w-10 h-10 text-turf-green/30" />
          </div>
          <h3 className="text-lg font-heading font-black uppercase tracking-tight text-text-primary mb-2">
            Planned Implementation
          </h3>
          <p className="text-text-secondary text-sm font-sans mb-4">
            Document management features are currently in development.
          </p>
          <div className="inline-block px-4 py-2 bg-turf-green/10 text-turf-green text-xs font-heading font-black uppercase tracking-widest">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
