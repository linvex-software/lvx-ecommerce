import { Template } from './types'

/**
 * Template gerado automaticamente do Figma
 * Design: Cosmic Fashion - Cover Page
 * URL: https://www.figma.com/design/8srk2lbrZT4uDBUrYXcRci/Cosmic-Fashion--Community-?node-id=9-2169
 */
export const cosmicFashionTemplate: Template = {
  id: 'cosmic-fashion-cover',
  name: 'Cosmic Fashion Cover',
  description: 'Template de e-commerce fashion com hero section, seções de produtos e grid de designers',
  category: 'fashion',
  thumbnail: '/templates/cosmic-fashion-thumb.png',
  structure: [
    {
      component: 'HeroBanner',
      props: {
        title: 'New in',
        subtitle: 'Shop the latest fashion trends from the top luxury designers.',
        buttonText: 'Shop New In',
        buttonLink: '/new-in',
        imageUrl: '',
        backgroundColor: '#FAFAFA',
        textColor: '#000000'
      }
    },
    {
      component: 'CategoryGrid',
      props: {
        title: 'Iconic designers',
        categoriesCount: 4,
        categories: [
          {
            id: '1',
            imageUrl: '',
            title: 'Saint Laurent',
            description: '',
            link: '/designers/saint-laurent'
          },
          {
            id: '2',
            imageUrl: '',
            title: 'Loewe',
            description: '',
            link: '/designers/loewe'
          },
          {
            id: '3',
            imageUrl: '',
            title: 'Balenciaga',
            description: '',
            link: '/designers/balenciaga'
          },
          {
            id: '4',
            imageUrl: '',
            title: 'Gucci',
            description: '',
            link: '/designers/gucci'
          }
        ],
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        padding: 60,
        gap: 20
      }
    },
    {
      component: 'TextBanner',
      props: {
        text: 'a style that fits everyone',
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        padding: 40,
        fontSize: 32,
        fontWeight: 800
      }
    },
    {
      component: 'ProductSection',
      props: {
        title: 'A shoe for every occasion',
        viewAllText: 'Shop shoes',
        viewAllLink: '/shoes',
        productsCount: 4,
        showNavigation: true,
        backgroundColor: '#FAFAFA',
        textColor: '#000000',
        padding: 60,
        gap: 20
      }
    },
    {
      component: 'ProductSection',
      props: {
        title: 'Designer bags',
        viewAllText: 'Shop bags',
        viewAllLink: '/bags',
        productsCount: 4,
        showNavigation: true,
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        padding: 60,
        gap: 20
      }
    },
    {
      component: 'CategoryGrid',
      props: {
        title: 'Featured Brands',
        categoriesCount: 6,
        categories: [
          {
            id: '1',
            imageUrl: '',
            title: 'Bottega Veneta',
            description: '',
            link: '/brands/bottega-veneta'
          },
          {
            id: '2',
            imageUrl: '',
            title: 'Balenciaga',
            description: '',
            link: '/brands/balenciaga'
          },
          {
            id: '3',
            imageUrl: '',
            title: 'Jimmy Choo',
            description: '',
            link: '/brands/jimmy-choo'
          },
          {
            id: '4',
            imageUrl: '',
            title: 'Balmain',
            description: '',
            link: '/brands/balmain'
          },
          {
            id: '5',
            imageUrl: '',
            title: 'Gucci',
            description: '',
            link: '/brands/gucci'
          },
          {
            id: '6',
            imageUrl: '',
            title: 'Loewe',
            description: '',
            link: '/brands/loewe'
          }
        ],
        backgroundColor: '#FFFFFF',
        textColor: '#000000',
        padding: 60,
        gap: 20
      }
    },
    {
      component: 'FooterSection',
      props: {
        backgroundColor: '#EDE9E9',
        textColor: '#000000'
      }
    }
  ]
}




