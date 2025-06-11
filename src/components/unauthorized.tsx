import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';

const UnauthorizedPage = () => {
  return (
    <div className="container grid grid-cols-1 md:grid-cols-2 gap-4 items-center mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div>
        <img src="https://erapharma.meu-solutions.com/assets/errorPage-De7a-JEy.png" alt="" />
      </div>
      <div className="flex flex-col gap-4 items-center text-center">
        <h3 className='text-3xl text-[#6f42c1] font-medium'>OOPS!</h3>
        <p className="text-2xl text-muted-foreground italic">Xin lỗi, chúng tôi không thể tìm thấy trang!</p>
        <Button 
          asChild
          variant="outline"
          className="w-50 h-12 text-center rounded-full self-center"
        >
          <Link to="/" className='text-primary flex items-center gap-2'>
            <ArrowLeft /> Quay về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
