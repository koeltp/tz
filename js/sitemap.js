const fs = require('fs');
const path = require('path');

// 配置信息
const config = {
  baseUrl: 'https://tptz.taipi.top',
  dataDirs: {
    tptz: path.join(__dirname, '..', 'data', 'tptz'),
    xszb: path.join(__dirname, '..', 'data', 'xszb')
  },
  outputDir: path.join(__dirname, '..')
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

// 生成sitemap索引文件头部
const generateSitemapIndexHeader = () => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
};

// 生成sitemap索引文件尾部
const generateSitemapIndexFooter = () => {
  return `</sitemapindex>`;
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

// 生成sitemap索引条目
const generateSitemapEntry = (url, lastmod) => {
  return `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
`;
};

// 获取文件修改时间
const getLastModifiedDate = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.mtime.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
};

// 生成单个数据源的sitemap
const generateSourceSitemap = (source, dataDir) => {
  try {
    // 读取data目录下的所有JSON文件
    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(dataDir, file));
    
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
    const outputFile = path.join(config.outputDir, `sitemap-${source}.xml`);
    fs.writeFileSync(outputFile, sitemapContent, 'utf8');
    
    console.log(`Sitemap for ${source} generated successfully: ${outputFile}`);
    console.log(`Total URLs for ${source}: ${files.length + 2}`);
    
    return {
      url: `${config.baseUrl}/sitemap-${source}.xml`,
      lastmod: new Date().toISOString().split('T')[0]
    };
    
  } catch (error) {
    console.error(`Error generating sitemap for ${source}:`, error.message);
    return null;
  }
};

// 生成主sitemap索引文件
const generateSitemapIndex = (sitemaps) => {
  try {
    let indexContent = generateSitemapIndexHeader();
    
    sitemaps.forEach(sitemap => {
      if (sitemap) {
        indexContent += generateSitemapEntry(sitemap.url, sitemap.lastmod);
      }
    });
    
    indexContent += generateSitemapIndexFooter();
    
    // 写入主sitemap文件
    const outputFile = path.join(config.outputDir, 'sitemap.xml');
    fs.writeFileSync(outputFile, indexContent, 'utf8');
    
    console.log(`Main sitemap index generated successfully: ${outputFile}`);
    console.log(`Total sitemaps: ${sitemaps.length}`);
    
  } catch (error) {
    console.error('Error generating sitemap index:', error.message);
    process.exit(1);
  }
};

// 生成所有sitemap
const generateAllSitemaps = () => {
  const sitemaps = [];
  
  // 为每个数据源生成sitemap
  Object.keys(config.dataDirs).forEach(source => {
    const dataDir = config.dataDirs[source];
    const sitemap = generateSourceSitemap(source, dataDir);
    sitemaps.push(sitemap);
  });
  
  // 生成主sitemap索引文件
  generateSitemapIndex(sitemaps);
};

// 运行生成脚本
generateAllSitemaps();