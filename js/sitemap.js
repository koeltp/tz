const fs = require('fs');
const path = require('path');

// 配置信息
const config = {
  baseUrl: 'https://tptz.taipi.top',
  dataDir: path.join(__dirname, '..', 'data'),
  outputFile: path.join(__dirname, '..', 'sitemap.xml')
};

// 生成XML头部
const generateXmlHeader = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
};

// 生成XML尾部
const generateXmlFooter = () => {
  return `</urlset>`;
};

// 生成单个URL条目
const generateUrlEntry = (url, priority = '0.5', lastmod = '') => {
  let entry = `  <url>
    <loc>${url}</loc>
    <priority>${priority}</priority>
`;
  
  if (lastmod) {
    entry += `    <lastmod>${lastmod}</lastmod>
`;
  }
  
  entry += `  </url>
`;
  return entry;
};

// 获取文件修改时间
const getLastModifiedDate = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.mtime.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
};

// 生成sitemap.xml
const generateSitemap = () => {
  try {
    // 读取data目录下的所有JSON文件
    const files = fs.readdirSync(config.dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(config.dataDir, file));
    
    // 生成sitemap内容
    let sitemapContent = generateXmlHeader();
    
    // 添加首页
    sitemapContent += generateUrlEntry(`${config.baseUrl}/index.html`, '1.0');
    
    // 添加时光机页面
    sitemapContent += generateUrlEntry(`${config.baseUrl}/timeline.html`, '0.8');
    
    // 添加所有周报详情页面
    files.forEach(file => {
      const fileName = path.basename(file, '.json');
      const url = `${config.baseUrl}/detail.html?id=${fileName}`;
      const lastmod = getLastModifiedDate(file);
      sitemapContent += generateUrlEntry(url, '0.9', lastmod);
    });
    
    // 添加XML尾部
    sitemapContent += generateXmlFooter();
    
    // 写入文件
    fs.writeFileSync(config.outputFile, sitemapContent, 'utf8');
    
    console.log(`Sitemap generated successfully: ${config.outputFile}`);
    console.log(`Total URLs: ${files.length + 2}`);
    
  } catch (error) {
    console.error('Error generating sitemap:', error.message);
    process.exit(1);
  }
};

// 运行生成脚本
generateSitemap();