import { Loader2 } from 'lucide-react';
import { PageContainer } from './PageContainer';

/** Full-page centered spinner shown while a CRUD list loads its first page. */
export function PageLoading() {
  return (
    <PageContainer fullHeight noGap>
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    </PageContainer>
  );
}

export default PageLoading;
