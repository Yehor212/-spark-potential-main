import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Star, Trash2, Edit } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/hooks/useCurrency';
import type { Account } from '@/types/finance';

interface AccountCardProps {
  account: Account;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
  onSetDefault?: (id: string) => void;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'accounts.types.checking',
  savings: 'accounts.types.savings',
  credit: 'accounts.types.credit',
  investment: 'accounts.types.investment',
  cash: 'accounts.types.cash',
};

export function AccountCard({
  account,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AccountCardProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();

  const isNegative = account.type === 'credit' ? account.balance > 0 : account.balance < 0;

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => onSelect?.(account.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: `${account.color}20` }}
            >
              {account.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{account.name}</span>
                {account.isDefault && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <Badge variant="secondary" className="mt-1">
                {t(ACCOUNT_TYPE_LABELS[account.type])}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(account)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              {!account.isDefault && (
                <DropdownMenuItem onClick={() => onSetDefault?.(account.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  {t('accounts.setDefault')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(account.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <div className="text-sm text-muted-foreground">{t('accounts.balance')}</div>
          <div
            className={`text-2xl font-bold ${
              isNegative ? 'text-destructive' : 'text-foreground'
            }`}
          >
            {formatAmount(account.balance)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
