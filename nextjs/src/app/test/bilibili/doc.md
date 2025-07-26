
# B站视频嵌入代码
<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114905323670404&bvid=BV1nL8NzkEyx&cid=31239767768&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

# B站显示视频封面
```
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i0.hdslb.com', // Example Bilibili image host, adjust as needed
        port: '',
        pathname: '/bfs/archive/**', // Adjust pathname if needed
      },
      // Add other Bilibili image hosts if necessary
    ],
  },
};

module.exports = nextConfig;
```    **Note:** The `hostname` and `pathname` in `remotePatterns` should match the actual domain(s) and paths of the Bilibili video cover URLs you obtain. You may need to inspect the URLs from the unofficial methods to determine the correct values.

**Example React Component (using `getServerSideProps`):**


import Image from 'next/image';

// This function runs on the server for each request
export async function getServerSideProps(context) {
  const { videoId } = context.query; // Assuming you pass videoId as a query parameter

  let coverImageUrl = '';
  // Replace this with your logic to get the Bilibili video cover URL
  // This could involve:
  // 1. Making a request to a third-party Bilibili thumbnail API
  // 2. A server-side scraping utility if you've implemented one
  // 3. Constructing the URL if you know the pattern (e.g., from an unofficial source)
  
  // Example (placeholder - replace with actual logic)
  // For demonstration, let's assume a hypothetical direct URL pattern
  coverImageUrl = `https://i0.hdslb.com/bfs/archive/${videoId}_cover.jpg`; 

  return {
    props: {
      coverImageUrl,
    },
  };
}

function BilibiliVideoCover({ coverImageUrl }) {
  return (
    <div>
      {coverImageUrl ? (
        <Image
          src={coverImageUrl}
          alt="Bilibili Video Cover"
          width={480} // Set appropriate width
          height={270} // Set appropriate height (e.g., 16:9 aspect ratio)
          priority // Or 'lazy' if not critical for LCP
        />
      ) : (
        <p>无法获取视频封面。</p>
      )}
    </div>
  );
}

export default BilibiliVideoCover;
```