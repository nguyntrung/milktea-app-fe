import Banner from "./components/banner";
import Categories from "./components/categories";
import Reviews from "./components/review";
import TopSeller from "./components/top-seller";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Container với responsive padding */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Hero Banner Section */}
        <Banner />

        {/* Categories Section */}
        <Categories />

        {/* Suggested Products Section */}
        <section className="py-2">
          <div className="text-center lg:text-left">
            <h2 className="text-xl font-bold text-gray-900 sm:text-3xl lg:text-lg">
              Sản phẩm bán chạy
            </h2>
          </div>
          
          {/* Placeholder for suggested products */}
          {/* <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-8 sm:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">Sản phẩm gợi ý sẽ được hiển thị tại đây</p>
          </div> */}

          <TopSeller limit={4} />
        </section>

        <Reviews />
      </div>
    </div>
  );
}
