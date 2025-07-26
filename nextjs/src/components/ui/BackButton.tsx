'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useUI } from '@/contexts/UIContext';

interface BackButtonProps {
  /** 返回目标路径，默认为 '/faq' */
  href?: string;
  /** 按钮文本 */
  children: React.ReactNode;
  /** 是否为sticky定位 */
  sticky?: boolean;
  /** 额外的CSS类名 */
  className?: string;
  /** 点击前的回调函数，可用于保存状态 */
  onBeforeNavigate?: () => void;
}

export default function BackButton({ 
  href = '/faq', 
  children, 
  sticky = true,
  className = '',
  onBeforeNavigate 
}: BackButtonProps) {
  const router = useRouter();
  const { deviceType } = useUI();

  const handleClick = () => {
    // 执行导航前的回调
    if (onBeforeNavigate) {
      onBeforeNavigate();
    }

    // 如果目标是FAQ页面，尝试恢复之前的筛选条件
    if (href === '/faq' || href.startsWith('/faq?')) {
      const savedFilters = sessionStorage.getItem('faq-filters');
      let targetUrl = href;
      
      if (savedFilters && href === '/faq') {
        try {
          const filters = JSON.parse(savedFilters);
          const params = new URLSearchParams();
          
          if (filters.search) params.set('q', filters.search);
          if (filters.categoryId) params.set('category_id', filters.categoryId);
          if (filters.productModelId) params.set('product_model_id', filters.productModelId);
          if (filters.tagId) params.set('tag_id', filters.tagId);
          if (filters.sortBy && filters.sortBy !== 'latest') params.set('sort', filters.sortBy);
          if (filters.period && filters.period !== 'all') params.set('period', filters.period);
          
          const queryParams = params.toString();
          targetUrl = queryParams ? `/faq?${queryParams}` : '/faq';
        } catch (err) {
          console.warn('Failed to parse saved filters:', err);
        }
      }
      
      router.push(targetUrl);
    } else {
      router.push(href);
    }
  };

  const baseClasses = `
    flex items-center space-x-2 font-medium
    hover:bg-accent hover:text-accent-foreground
    border-border/50
  `;

  const sizeClasses = deviceType === 'mobile' 
    ? 'h-11 px-4 text-base' 
    : 'h-9 px-3';

  const positionClasses = sticky 
    ? 'sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10' 
    : '';

  return (
    <div className={`${positionClasses} ${sticky ? 'py-2 mb-4' : ''}`}>
      <Button 
        variant="outline"
        onClick={handleClick}
        className={`${baseClasses} ${sizeClasses} ${className}`}
        aria-label={typeof children === 'string' ? children : '返回上一页'}
      >
        <ArrowLeft className={deviceType === 'mobile' ? 'h-5 w-5' : 'h-4 w-4'} />
        {children}
      </Button>
    </div>
  );
} 