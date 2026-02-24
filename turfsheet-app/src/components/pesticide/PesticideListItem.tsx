import type { PesticideApplication } from '../../types';

interface PesticideListItemProps {
    application: PesticideApplication;
    operatorName: string;
    onClick: () => void;
}

export default function PesticideListItem({ application, operatorName, onClick }: PesticideListItemProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatMethod = (method?: string) => {
        if (!method) return '--';
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    return (
        <div
            onClick={onClick}
            className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-border-color hover:bg-dashboard-bg cursor-pointer transition-colors items-center"
        >
            <span className="text-sm font-sans text-text-primary">
                {formatDate(application.application_date)}
            </span>
            <span className="text-sm font-sans text-text-primary font-medium">
                {application.product_name}
            </span>
            <span className="text-sm font-sans text-text-secondary">
                {application.application_rate}
            </span>
            <span className="text-sm font-sans text-text-secondary">
                {application.area_applied}
            </span>
            <span className="text-sm font-sans text-text-secondary">
                {operatorName}
            </span>
            <span className="text-sm font-sans text-text-secondary">
                {formatMethod(application.method)}
            </span>
        </div>
    );
}
