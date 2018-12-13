window.website = true;

// const RAW_GITHUB =
// 'https://raw.githubusermarkdown.crequire(o../../docs/m/uber-web/loaders.gl/master';)

export default [
  {
    name: 'Documentation',
    path: '/docs',
    data: [
      {
        name: 'Overview',
        children: [
          {
            name: 'Introduction',
            markdown: require('../../docs/README.md')
          },
          {
            name: 'What\'s New',
            markdown: require('../../docs/whats-new.md')
          },
          {
            name: 'Roadmap',
            markdown: require('../../docs/roadmap.md')
          },
          {
            name: 'Upgrade Guide',
            markdown: require('../../docs/upgrade-guide.md')
          }
        ]
      },
      {
        name: 'Getting Started',
        children: [
          {
            name: 'Overview',
            markdown: require('../../docs/get-started/README.md')
          }
        ]
      },
      {
        name: 'Developer Guide',
        children: [
          {
            name: 'About Loaders',
            markdown: require('../../docs/developer-guide/about-loaders.md')
          },
          {
            name: 'Loader Categories',
            markdown: require('../../docs/developer-guide/loader-categories.md')
          },
          {
            name: 'PointCloud Category Loaders',
            markdown: require('../../docs/developer-guide/category-pointcloud.md')
          },
          {
            name: 'glbdump',
            markdown: require('../../docs/developer-guide/glbdump.md')
          }
        ]
      },
      {
        name: 'API Reference',
        children: [
          {
            name: 'loadFile',
            markdown: require('../../docs/api-reference/core/load-file.md')
          },
          {
            name: 'GLTF Loaders',
            children: [
              {
                name: 'GLTFLoader',
                markdown: require('../../docs/api-reference/gltf-loaders/gltf-loader.md')
              },
              {
                name: 'GLTFParser',
                markdown: require('../../docs/api-reference/gltf-loaders/gltf-parser.md')
              },
              {
                name: 'GLTFBuilder',
                markdown: require('../../docs/api-reference/gltf-loaders/gltf-builder.md')
              },
              {
                name: 'GLBLoader',
                markdown: require('../../docs/api-reference/gltf-loaders/glb-loader.md')
              },
              {
                name: 'GLBWriter',
                markdown: require('../../docs/api-reference/gltf-loaders/glb-writer.md')
              },
              {
                name: 'GLBBuilder',
                markdown: require('../../docs/api-reference/gltf-loaders/glb-builder.md')
              }
            ]
          },
          {
            name: 'Point Cloud & Mesh Loaders',
            children: [
              {
                name: 'DRACOLoader (PointCloud / Mesh)',
                markdown: require('../../docs/api-reference/loaders/draco-loader.md')
              },
              {
                name: 'DRACOEncoder (PointCloud / Mesh)',
                markdown: require('../../docs/api-reference/loaders/draco-encoder.md')
              },
              {
                name: 'LASLoader (PointCloud)',
                markdown: require('../../docs/api-reference/loaders/las-loader.md')
              },
              {
                name: 'OBJLoader (Mesh)',
                markdown: require('../../docs/api-reference/loaders/obj-loader.md')
              },
              {
                name: 'PCDLoader (PointCloud)',
                markdown: require('../../docs/api-reference/loaders/pcd-loader.md')
              },
              {
                name: 'PLYLoader (PointCloud / Mesh)',
                markdown: require('../../docs/api-reference/loaders/ply-loader.md')
              }
            ]
          },
          {
            name: 'Geospatial Loaders',
            children: [
              {
                name: 'KMLLoader',
                markdown: require('../../docs/api-reference/loaders/kml-loader.md')
              }
            ]
          }
        ]
      }
    ]
  }
];
