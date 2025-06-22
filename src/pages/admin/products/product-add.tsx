import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getData, postData, postFormData, putData } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import JoditEditor from 'jodit-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { X, Plus, Upload } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Định nghĩa các interface
interface Category {
  _id: string;
  ten: string;
}

interface ThanhPhan {
  maNguyenLieu: string | { _id: string; ten: string };
  soLuong: number;
  donViTinh: string;
}

interface LuaChonSize {
  tenSize: string;
  giaTang: number;
  thanhPhan: ThanhPhan[];
}

interface ProductForm {
  ten: string;
  moTa: string;
  maDanhMuc: string;
  giaCoBan: number;
  luaChonSize: {
    tenSize: string;
    giaTang: number;
    thanhPhan: {
      maNguyenLieu: string;
      soLuong: number;
      donViTinh: string;
    }[];
  }[];
  hoatDong: boolean;
  hinhAnh?: string[];
  tuychon?: string[];
  congThuc?: string;
  toppingCoTheThem?: string[];
}

// Định nghĩa schema validation cho form
const productSchema = z.object({
  ten: z.string().min(1, "Tên sản phẩm không được để trống"),
  moTa: z.string().min(1, "Mô tả không được để trống"),
  maDanhMuc: z.string().min(1, "Vui lòng chọn danh mục"),
  giaCoBan: z.coerce.number().min(0, "Giá không được âm"),
  luaChonSize: z.array(z.object({
    tenSize: z.string().min(1, "Tên size không được để trống"),
    giaTang: z.coerce.number().min(0, "Giá tăng không được âm"),
    thanhPhan: z.array(z.object({
      maNguyenLieu: z.string(),
      soLuong: z.coerce.number().min(0, "Số lượng không được âm"),
      donViTinh: z.string(), // Loại bỏ default để khớp với kiểu
    }))
  })),
  hinhAnh: z.array(z.string()).optional(),
  tuychon: z.array(z.string()).optional(),
  hoatDong: z.boolean(), // Loại bỏ default ở đây, sẽ xử lý ở defaultValues
  congThuc: z.string().optional(),
  toppingCoTheThem: z.array(z.string()).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// Các tùy chọn mặc định
const defaultOptions = [
  { value: "Đá", label: "Đá" },
  { value: "Đường", label: "Đường" },
  { value: "Sữa", label: "Sữa" }
];

export default function ProductAdd() {
  const navigate = useNavigate();
  const editor = useRef(null);
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id;

  // State cho dữ liệu
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<{ value: string; label: string }[]>([]);
  const [ingredients, setIngredients] = useState<{ value: string; label: string; donViTinh: string }[]>([]);
  
  // State cho UI
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  
  // State cho dữ liệu sản phẩm
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [productSizes, setProductSizes] = useState<LuaChonSize[]>([
    { tenSize: 'M', giaTang: 0, thanhPhan: [] }
  ]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [giaCoBan, setGiaCoBan] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State mới cho nguyên liệu chung
  const [productIngredients, setProductIngredients] = useState<{
    maNguyenLieu: string;
    ten: string;
    soLuongTheoSize: Record<string, number>;
  }[]>([]);

  // State để lưu dữ liệu sản phẩm trước khi load
  const [productDataToLoad, setProductDataToLoad] = useState<ProductFormValues | null>(null);
  
  // Khởi tạo form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ten: "",
      moTa: "",
      maDanhMuc: "",
      giaCoBan: 0,
      luaChonSize: [{ tenSize: 'M', giaTang: 0, thanhPhan: [] }],
      hinhAnh: [],
      tuychon: [],
      hoatDong: true, // Đặt giá trị mặc định ở đây
      congThuc: "",
      toppingCoTheThem: [],
    },
    mode: "onChange", // Đảm bảo validation chạy ngay khi thay đổi
  });

  // Lấy dữ liệu khi component được mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await getData("/api/categories");
        if (categoriesResponse.success && Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data);
        }

        // Fetch toppings
        const toppingsResponse = await getData("/api/toppings");
        if (toppingsResponse.success && Array.isArray(toppingsResponse.data)) {
          const formattedToppings = toppingsResponse.data.map((topping: { _id: string; ten: string }) => ({
            value: topping._id,
            label: topping.ten
          }));
          setToppings(formattedToppings);
        }

        // Fetch ingredients
        const ingredientsResponse = await getData("/api/ingredients");
        if (ingredientsResponse.success && Array.isArray(ingredientsResponse.data)) {
          const formattedIngredients = ingredientsResponse.data.map((ingredient: { _id: string; ten: string; donViTinh: string }) => ({
            value: ingredient._id,
            label: ingredient.ten,
            donViTinh: ingredient.donViTinh
          }));
          setIngredients(formattedIngredients);

          // Load dữ liệu sản phẩm nếu ở chế độ chỉnh sửa
          if (isEditMode) {
            let product;
            if (location.state?.product) {
              product = location.state.product;
            } else {
              const productResponse = await getData(`/api/products/${id}`);
              if (productResponse.success && productResponse.data) {
                product = productResponse.data;
              } else {
                toast.error("Không thể tải thông tin sản phẩm");
                navigate("/admin/products");
                return;
              }
            }
            setProductDataToLoad(product);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        toast.error("Không thể tải dữ liệu cần thiết");
      }
    };

    fetchData();
  }, [id, isEditMode, navigate, location.state]);

  // Load dữ liệu sản phẩm sau khi tất cả dữ liệu cần thiết đã sẵn sàng
  useEffect(() => {
    if (productDataToLoad && ingredients.length > 0 && categories.length > 0 && toppings.length > 0) {
      loadProductData(productDataToLoad);
    }
  }, [productDataToLoad, ingredients, categories, toppings]);

  // Hàm tải dữ liệu sản phẩm vào form
  const loadProductData = (product: ProductForm) => {
    console.log("Loading product data:", product);

    // Xử lý maDanhMuc
    const categoryId = typeof product.maDanhMuc === 'object' && (product.maDanhMuc as { _id: string })?._id
      ? (product.maDanhMuc as { _id: string })._id
      : product.maDanhMuc || "";

    // Xử lý toppingCoTheThem
    const loadedToppings = product.toppingCoTheThem?.map((topping: string | { _id: string }) => {
      return typeof topping === 'string' ? topping : topping._id;
    }) || [];

    // Xử lý luaChonSize và thanhPhan
    const formattedSizes = (product.luaChonSize || []).map((size: LuaChonSize) => ({
      ...size,
      thanhPhan: (size.thanhPhan || []).map((tp: ThanhPhan) => ({
        maNguyenLieu: typeof tp.maNguyenLieu === 'object' ? tp.maNguyenLieu._id : tp.maNguyenLieu,
        soLuong: tp.soLuong || 0,
        donViTinh: tp.donViTinh || "GRAM",
      })),
    }));

    // Cập nhật form
    form.reset({
      ten: product.ten || "",
      moTa: product.moTa || "",
      maDanhMuc: categoryId,
      giaCoBan: product.giaCoBan || 0,
      luaChonSize: formattedSizes.length > 0 ? formattedSizes : [{ tenSize: 'M', giaTang: 0, thanhPhan: [] }],
      hinhAnh: product.hinhAnh || [],
      tuychon: product.tuychon || [],
      hoatDong: product.hoatDong ?? true, // Đảm bảo giá trị mặc định
      congThuc: product.congThuc || "",
      toppingCoTheThem: loadedToppings,
    });

    // Cập nhật các state khác
    setGiaCoBan(product.giaCoBan || 0);
    setSelectedImages(product.hinhAnh || []);
    setOptions(product.tuychon || []);
    setSelectedToppings(loadedToppings);
    setContent(product.congThuc || "");
    setProductSizes(formattedSizes.length > 0 ? formattedSizes : [{ tenSize: 'M', giaTang: 0, thanhPhan: [] }]);

    // Chuyển đổi thành phần thành cấu trúc productIngredients
    const ingredientMap = new Map();
    if (product.luaChonSize && product.luaChonSize.length > 0) {
      product.luaChonSize.forEach((size: LuaChonSize) => {
        if (size.thanhPhan && size.thanhPhan.length > 0) {
          size.thanhPhan.forEach((tp: ThanhPhan) => {
            const ingredientId = typeof tp.maNguyenLieu === 'object' ? tp.maNguyenLieu._id : tp.maNguyenLieu;
            if (!ingredientMap.has(ingredientId)) {
              const ingredient = ingredients.find(i => i.value === ingredientId);
              if (ingredient) {
                const soLuongTheoSize: Record<string, number> = {};
                product.luaChonSize.forEach((s: LuaChonSize) => {
                  soLuongTheoSize[s.tenSize] = 0;
                });
                ingredientMap.set(ingredientId, {
                  maNguyenLieu: ingredientId,
                  ten: ingredient.label,
                  soLuongTheoSize
                });
              }
            }
            const currentIngredient = ingredientMap.get(ingredientId);
            if (currentIngredient) {
              currentIngredient.soLuongTheoSize[size.tenSize] = tp.soLuong || 0;
            }
          });
        }
      });
    }

    const productIngredientsArray = Array.from(ingredientMap.values());
    console.log("Loaded ingredients:", productIngredientsArray);
    setProductIngredients(productIngredientsArray);
  };

  // Thêm nguyên liệu vào danh sách chung
  const addIngredient = () => {
    if (selectedIngredientId) {
      const ingredient = ingredients.find(i => i.value === selectedIngredientId);
      if (ingredient && !productIngredients.some(i => i.maNguyenLieu === selectedIngredientId)) {
        const soLuongTheoSize: Record<string, number> = {};
        productSizes.forEach(size => {
          soLuongTheoSize[size.tenSize] = 0;
        });
        
        setProductIngredients([
          ...productIngredients,
          {
            maNguyenLieu: selectedIngredientId,
            ten: ingredient.label,
            soLuongTheoSize
          }
        ]);
        setSelectedIngredientId("");
      }
    }
  };

  // Cập nhật số lượng nguyên liệu theo size
  const updateIngredientQuantity = (ingredientIndex: number, sizeName: string, quantity: number) => {
    const newIngredients = [...productIngredients];
    newIngredients[ingredientIndex].soLuongTheoSize[sizeName] = quantity;
    setProductIngredients(newIngredients);
  };

  // Xóa nguyên liệu
  const removeIngredient = (index: number) => {
    const newIngredients = [...productIngredients];
    newIngredients.splice(index, 1);
    setProductIngredients(newIngredients);
  };

  // Thêm size mới
  const addProductSize = () => {
    const newSize = { tenSize: '', giaTang: 0, thanhPhan: [] };
    setProductSizes([...productSizes, newSize]);
    
    const newIngredients = productIngredients.map(ingredient => {
      const newSoLuongTheoSize = { ...ingredient.soLuongTheoSize };
      newSoLuongTheoSize[''] = 0;
      return {
        ...ingredient,
        soLuongTheoSize: newSoLuongTheoSize
      };
    });
    setProductIngredients(newIngredients);
  };

  // Cập nhật size
  const updateProductSize = (index: number, field: keyof LuaChonSize, value: string | number) => {
    const newSizes = [...productSizes];
    const oldSizeName = newSizes[index].tenSize;
    if (field === 'tenSize' && typeof value === 'string' && !value.trim()) {
      toast.error("Tên size không được để trống");
      return;
    }
    newSizes[index] = { ...newSizes[index], [field]: value };
    setProductSizes(newSizes);
    
    if (field === 'tenSize' && typeof value === 'string' && oldSizeName !== value) {
      const newIngredients = productIngredients.map(ingredient => {
        const newSoLuongTheoSize = { ...ingredient.soLuongTheoSize };
        const oldQuantity = newSoLuongTheoSize[oldSizeName] || 0;
        delete newSoLuongTheoSize[oldSizeName];
        newSoLuongTheoSize[value] = oldQuantity;
        return {
          ...ingredient,
          soLuongTheoSize: newSoLuongTheoSize
        };
      });
      setProductIngredients(newIngredients);
    }
  };

  // Xóa size
  const removeProductSize = (index: number) => {
    if (productSizes.length > 1) {
      const sizeToRemove = productSizes[index].tenSize;
      const newSizes = [...productSizes];
      newSizes.splice(index, 1);
      setProductSizes(newSizes);
      
      const newIngredients = productIngredients.map(ingredient => {
        const newSoLuongTheoSize = { ...ingredient.soLuongTheoSize };
        delete newSoLuongTheoSize[sizeToRemove];
        return {
          ...ingredient,
          soLuongTheoSize: newSoLuongTheoSize
        };
      });
      setProductIngredients(newIngredients);
    }
  };

  // Chuyển đổi dữ liệu trước khi submit
  const prepareDataForSubmit = () => {
    const sizesWithIngredients = productSizes.map(size => {
      const thanhPhan = productIngredients.map(ingredient => ({
        maNguyenLieu: ingredient.maNguyenLieu,
        soLuong: ingredient.soLuongTheoSize[size.tenSize] || 0,
        donViTinh: "GRAM"
      }));
      
      return {
        ...size,
        thanhPhan
      };
    });
    
    console.log("Prepared sizes for submit:", sizesWithIngredients);
    return sizesWithIngredients;
  };

  // Xử lý upload hình ảnh
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      setLoading(true);
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await postFormData('/api/products/upload-image', formData);

      if (response.success && response.data) {
        setSelectedImages(prev => [...prev, ...response.data]);
        toast.success("Tải ảnh lên thành công");
      } else {
        toast.error(response.message || "Tải ảnh lên thất bại");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Có lỗi khi tải ảnh lên");
    } finally {
      setLoading(false);
    }
  };

  // Xóa hình ảnh
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Thêm tùy chọn mới
  const addOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      setOptions(prev => [...prev, newOption.trim()]);
      setNewOption("");
    }
  };

  // Xóa tùy chọn
  const removeOption = (option: string) => {
    setOptions(prev => prev.filter(item => item !== option));
  };

  // Xử lý thay đổi topping
  const handleToppingChange = (selectedValues: string[]) => {
    setSelectedToppings(selectedValues);
  };

  // Xử lý submit form
  const onSubmit = async (data: ProductFormValues) => {
    try {
      console.log("Form data before submit:", data);

      const errors = form.formState.errors;
      if (Object.keys(errors).length > 0) {
        console.log("Form validation errors:", errors);
        toast.error("Vui lòng kiểm tra lại các trường thông tin");
        return;
      }

      setLoading(true);
      
      data.hinhAnh = selectedImages;
      data.tuychon = options;
      data.toppingCoTheThem = selectedToppings;
      data.luaChonSize = prepareDataForSubmit();
      data.giaCoBan = giaCoBan;
      data.congThuc = content;

      console.log("Data to send:", data);
      
      let response;
      if (isEditMode) {
        response = await putData(`/api/products/${id}`, data);
        console.log("API response:", response);
        if (response.success) {
          toast.success("Cập nhật sản phẩm thành công");
        } else {
          toast.error(response.message || "Cập nhật sản phẩm thất bại");
        }
      } else {
        response = await postData("/api/products", data);
        console.log("API response:", response);
        if (response.success) {
          toast.success("Thêm sản phẩm thành công");
        } else {
          toast.error(response.message || "Thêm sản phẩm thất bại");
        }
      }
      
      if (response.success) {
        navigate("/admin/products");
      }
    } catch (error) {
      console.error("Lỗi khi xử lý sản phẩm:", error);
      toast.error(`Có lỗi xảy ra khi ${isEditMode ? "cập nhật" : "thêm"} sản phẩm`);
    } finally {
      setLoading(false);
    }
  };

  // Cấu hình editor
  const config = {
    readonly: false,
    height: 400,
  };

  return (
    <div className="bg-background rounded-lg shadow-md mb-3">
      <Card>
        <CardHeader className="mt-4">
          <CardTitle>{isEditMode ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? "Chỉnh sửa thông tin sản phẩm trong form bên dưới" 
              : "Điền thông tin sản phẩm vào form bên dưới"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tên sản phẩm */}
                <FormField
                  control={form.control}
                  name="ten"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên sản phẩm</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên sản phẩm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Danh mục */}
                <FormField
                  control={form.control}
                  name="maDanhMuc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh mục</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="w-full">
                          {categories.map((category) => (
                            <SelectItem
                              key={category._id}
                              value={category._id}
                            >
                              {category.ten}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Giá cơ bản */}
                <FormField
                  control={form.control}
                  name="giaCoBan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giá cơ bản</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Nhập giá cơ bản" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setGiaCoBan(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mô tả */}
              <FormField
                control={form.control}
                name="moTa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả sản phẩm</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nhập mô tả sản phẩm"
                        className="h-45"
                        {...field}
                        onBlur={(e) => field.onChange(e.target.value)}
                        value={field.value}
                        tabIndex={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quản lý size */}
              <div className="border p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Quản lý size và giá tăng</FormLabel>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={addProductSize}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm size
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  {productSizes.map((size, sizeIndex) => (
                    <div key={sizeIndex} className="border rounded-md p-3 bg-muted/30 w-full md:w-[calc(50%-0.5rem)]">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Size #{sizeIndex + 1}</h3>
                        {productSizes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground"
                            onClick={() => removeProductSize(sizeIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Tên size:</label>
                          <Input
                            value={size.tenSize}
                            onChange={(e) => updateProductSize(sizeIndex, 'tenSize', e.target.value)}
                            placeholder="VD: M, L, XL..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Giá tăng:</label>
                          <Input
                            type="number"
                            value={size.giaTang}
                            onChange={(e) => updateProductSize(sizeIndex, 'giaTang', Number(e.target.value))}
                            placeholder="Nhập giá tăng"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Quản lý nguyên liệu */}
              <div className="border p-4 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Quản lý nguyên liệu</FormLabel>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[200px] justify-between"
                        >
                          {selectedIngredientId
                            ? ingredients.find(i => i.value === selectedIngredientId)?.label
                            : "Chọn nguyên liệu"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Tìm nguyên liệu..." 
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>Không tìm thấy nguyên liệu</CommandEmpty>
                            <CommandGroup>
                              {ingredients
                                .filter(ingredient =>
                                  ingredient.label.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((ingredient) => (
                                  <CommandItem
                                    key={ingredient.value}
                                    value={ingredient.value}
                                    onSelect={() => {
                                      setSelectedIngredientId(ingredient.value);
                                    }}
                                    disabled={productIngredients.some(i => i.maNguyenLieu === ingredient.value)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedIngredientId === ingredient.value ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {ingredient.label}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addIngredient}
                      disabled={!selectedIngredientId}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {productIngredients.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-2 border-r">Nguyên liệu</th>
                          {productSizes.map((size) => (
                            <th key={size.tenSize} className="text-center p-2 border-r">
                              {size.tenSize || 'Chưa đặt tên'}
                            </th>
                          ))}
                          <th className="w-10 p-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {productIngredients.map((ingredient, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2 border-r">{ingredient.ten}</td>
                            {productSizes.map((size) => (
                              <td key={size.tenSize} className="p-2 border-r">
                                <div className="flex items-center justify-center">
                                  <Input
                                    type="number"
                                    value={ingredient.soLuongTheoSize[size.tenSize] || 0}
                                    onChange={(e) => updateIngredientQuantity(
                                      index,
                                      size.tenSize,
                                      Number(e.target.value)
                                    )}
                                    className="h-8 w-24"
                                  />
                                  <span className="ml-1 text-sm">{ingredients.find(i => i.value === ingredient.maNguyenLieu)?.donViTinh}</span>
                                </div>
                              </td>
                            ))}
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground"
                                onClick={() => removeIngredient(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    Chưa có nguyên liệu nào được thêm
                  </div>
                )}
              </div>

              {/* Hình ảnh sản phẩm */}
              <div className="space-y-4">
                <FormLabel>Hình ảnh sản phẩm</FormLabel>
                <div className="flex flex-wrap gap-4">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border">
                      <img src={image} alt={`Hình ${index + 1}`} className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50">
                    <Upload className="h-6 w-6 mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Tải ảnh lên</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                {form.formState.errors.hinhAnh && (
                  <p className="text-destructive text-sm">{form.formState.errors.hinhAnh.message}</p>
                )}
              </div>

              {/* Tùy chọn */}
              <div className="space-y-4">
                <FormLabel>Tùy chọn (đá, đường, sữa...)</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {defaultOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
                        options.includes(option.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                      onClick={() => {
                        if (options.includes(option.value)) {
                          removeOption(option.value);
                        } else {
                          setOptions([...options, option.value]);
                        }
                      }}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
                <div className="gap-2 hidden">
                  <Input
                    placeholder="Thêm tùy chọn mới"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {options
                    .filter((option) => !defaultOptions.some((defaultOpt) => defaultOpt.value === option))
                    .map((option) => (
                      <div
                        key={option}
                        className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {option}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeOption(option)}
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Topping có thể thêm */}
              <div className="space-y-4">
                <FormLabel>Topping có thể thêm</FormLabel>
                <MultiSelect
                  options={toppings}
                  selectedValues={selectedToppings}
                  onChange={handleToppingChange}
                  placeholder="Chọn topping có thể thêm"
                />
              </div>

              {/* Công thức */}
              <div className="space-y-4">
                <FormLabel>Công thức chế biến</FormLabel>
                <JoditEditor
                  ref={editor}
                  value={content}
                  config={config}
                  onBlur={(newContent) => setContent(newContent)}
                />
              </div>

              {/* Trạng thái */}
              <FormField
                control={form.control}
                name="hoatDong"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hoạt động</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Sản phẩm sẽ được hiển thị trên trang web nếu được chọn
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <CardFooter className="flex justify-end gap-2 px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/products")}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading} onClick={() => console.log("Submit button clicked", form.getValues())}>
                  {loading ? "Đang xử lý..." : (isEditMode ? "Cập nhật sản phẩm" : "Thêm sản phẩm")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
