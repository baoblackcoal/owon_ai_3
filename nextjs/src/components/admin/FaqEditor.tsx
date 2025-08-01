'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  X, 
  Eye, 
  Edit3, 
  Tag, 
  FolderOpen, 
  Package,
  Video,
  Loader2
} from 'lucide-react';
import type { FaqEditorProps, FaqEditorData, FaqCategory, FaqProductModel, FaqTag } from '@/types/faq';
import FaqPreview from './FaqPreview';

export default function FaqEditor({ faq, onSave, onCancel }: FaqEditorProps) {
  const [formData, setFormData] = useState<FaqEditorData>({
    title: '',
    content: '',
    answer: '',
    category_id: '',
    product_model_id: '',
    software_version: '',
    video_bilibili_bvid: '',
    tags: [],
  });

  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [productModels, setProductModels] = useState<FaqProductModel[]>([]);
  const [tags, setTags] = useState<FaqTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newProductModel, setNewProductModel] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (faq) {
      setFormData({
        id: faq.id,
        title: faq.title,
        content: faq.content,
        answer: faq.answer,
        category_id: faq.category_id?.toString() || '',
        product_model_id: faq.product_model_id?.toString() || '',
        software_version: faq.software_version || '',
        video_bilibili_bvid: faq.video_bilibili_bvid || '',
        tags: faq.tags?.map(tag => tag.name) || [],
      });
    } else {
      setFormData({
        title: '',
        content: '',
        answer: '',
        category_id: '',
        product_model_id: '',
        software_version: '',
        video_bilibili_bvid: '',
        tags: [],
      });
    }
  }, [faq]);

  // 加载分类、产品型号、标签数据
  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const [categoriesRes, productModelsRes, tagsRes] = await Promise.all([
        fetch('/api/admin/faq/categories'),
        fetch('/api/admin/faq/product-models'),
        fetch('/api/admin/faq/tags'),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json() as { categories?: FaqCategory[] };
        setCategories(categoriesData.categories || []);
      }

      if (productModelsRes.ok) {
        const productModelsData = await productModelsRes.json() as { product_models?: FaqProductModel[] };
        setProductModels(productModelsData.product_models || []);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json() as { tags?: FaqTag[] };
        setTags(tagsData.tags || []);
      }
    } catch (error) {
      console.error('加载元数据失败:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.answer.trim()) {
      alert('请填写必填字段：标题、问题内容、答案内容');
      return;
    }

    try {
      setSaving(true);
      await onSave(formData);
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const response = await fetch('/api/admin/faq/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() }),
      });

      if (response.ok) {
        const data = await response.json() as { category: FaqCategory };
        setCategories(prev => [...prev, data.category]);
        setFormData(prev => ({ ...prev, category_id: data.category.id }));
        setNewCategory('');
      }
    } catch (error) {
      console.error('创建分类失败:', error);
    }
  };

  const handleCreateProductModel = async () => {
    if (!newProductModel.trim()) return;

    try {
      const response = await fetch('/api/admin/faq/product-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newProductModel.trim(),
          category_id: formData.category_id 
        }),
      });

      if (response.ok) {
        const data = await response.json() as { product_model: FaqProductModel };
        setProductModels(prev => [...prev, data.product_model]);
        setFormData(prev => ({ ...prev, product_model_id: data.product_model.id }));
        setNewProductModel('');
      }
    } catch (error) {
      console.error('创建产品型号失败:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return;

    try {
      const response = await fetch('/api/admin/faq/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTag.trim() }),
      });

      if (response.ok) {
        const data = await response.json() as { tag: FaqTag };
        setTags(prev => [...prev, data.tag]);
        handleAddTag();
      }
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {faq ? '编辑FAQ' : '新建FAQ'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* 编辑器内容 */}
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            编辑
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            预览
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入FAQ标题"
                />
              </div>

              <div>
                <Label htmlFor="content">问题内容 *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="描述问题内容"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="answer">答案内容 *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="输入答案内容（支持Markdown格式）"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          {/* 分类和产品型号 */}
          <Card>
            <CardHeader>
              <CardTitle>分类和产品</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">分类</Label>
                  <div className="flex gap-2">
                    <select
                      id="category"
                      value={formData.category_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">选择分类</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateCategory}
                      disabled={!newCategory.trim()}
                    >
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="新建分类"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="product-model">产品型号</Label>
                  <div className="flex gap-2">
                    <select
                      id="product-model"
                      value={formData.product_model_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_model_id: e.target.value }))}
                      className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">选择产品型号</option>
                      {productModels.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCreateProductModel}
                      disabled={!newProductModel.trim()}
                    >
                      <Package className="w-4 h-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="新建产品型号"
                    value={newProductModel}
                    onChange={(e) => setNewProductModel(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="software-version">软件版本</Label>
                <Input
                  id="software-version"
                  value={formData.software_version}
                  onChange={(e) => setFormData(prev => ({ ...prev, software_version: e.target.value }))}
                  placeholder="例如：v1.2.3"
                />
              </div>
            </CardContent>
          </Card>

          {/* 标签 */}
          <Card>
            <CardHeader>
              <CardTitle>标签</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !formData.tags?.includes(e.target.value)) {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...(prev.tags || []), e.target.value]
                      }));
                    }
                  }}
                  className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">选择现有标签</option>
                  {tags.map(tag => (
                    <option key={tag.id} value={tag.name}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTag.trim()}
                >
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              
              <Input
                placeholder="新建标签"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />

              {/* 已选标签 */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 视频链接 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                视频链接
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="video-bvid">Bilibili BVID</Label>
                <Input
                  id="video-bvid"
                  value={formData.video_bilibili_bvid}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_bilibili_bvid: e.target.value }))}
                  placeholder="例如：BV1xx411c7mD"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  输入Bilibili视频的BVID（BV开头的12位字符）
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <FaqPreview data={formData} isPreview={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 