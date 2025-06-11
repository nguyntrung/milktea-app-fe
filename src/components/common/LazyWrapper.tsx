import { Suspense } from "react";

interface LazyWrapperProps {
  children: React.ReactNode;
}

const LazyWrapper = ({ children }: LazyWrapperProps) => {
  return (
    <Suspense fallback={<div className="text-center py-8">Đang tải...</div>}>
      {children}
    </Suspense>
  );
};

export default LazyWrapper;
