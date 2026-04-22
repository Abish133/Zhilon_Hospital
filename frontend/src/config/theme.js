// Premium monochrome (black & white) theme
// All screens inherit this — compact spacing, crisp typography, hard borders, no gradients.

export const theme = {
  token: {
    colorPrimary: '#0a0a0a',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0a0a0a',
    colorLink: '#0a0a0a',
    colorLinkHover: '#404040',

    colorText: '#0a0a0a',
    colorTextBase: '#0a0a0a',
    colorTextSecondary: '#525252',
    colorTextTertiary: '#737373',
    colorTextPlaceholder: '#a3a3a3',

    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgMask: 'rgba(10, 10, 10, 0.45)',

    colorBorder: '#e5e5e5',
    colorBorderSecondary: '#ededed',

    borderRadius: 8,
    borderRadiusLG: 10,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    fontSize: 13,
    fontSizeHeading1: 26,
    fontSizeHeading2: 20,
    fontSizeHeading3: 16,
    fontFamily: "Inter, 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
    lineHeight: 1.5,

    controlHeight: 36,
    controlHeightLG: 42,
    controlHeightSM: 28,

    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    boxShadowTertiary: '0 1px 2px rgba(0,0,0,0.04)',

    motionUnit: 0.08
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 56,
      headerPadding: '0 20px',
      siderBg: '#0a0a0a',
      bodyBg: '#f5f5f5',
      triggerBg: '#0a0a0a',
      triggerColor: '#ffffff'
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: '#ffffff',
      darkItemSelectedColor: '#0a0a0a',
      darkItemHoverBg: 'rgba(255,255,255,0.08)',
      darkItemHoverColor: '#ffffff',
      darkItemColor: 'rgba(255,255,255,0.72)',
      itemMarginInline: 8,
      itemBorderRadius: 8,
      itemHeight: 38,
      iconSize: 15,
      itemPaddingInline: 12,
      subMenuItemBg: 'transparent'
    },
    Card: {
      borderRadiusLG: 10,
      paddingLG: 18,
      headerBg: '#ffffff',
      headerFontSize: 14,
      headerHeight: 48,
      colorBorderSecondary: '#ededed',
      boxShadowTertiary: '0 1px 2px rgba(0,0,0,0.04)'
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      fontWeight: 500,
      primaryShadow: 'none',
      defaultShadow: 'none',
      dangerShadow: 'none'
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      paddingBlock: 7,
      paddingInline: 12,
      activeBorderColor: '#0a0a0a',
      hoverBorderColor: '#0a0a0a',
      activeShadow: '0 0 0 2px rgba(10,10,10,0.08)'
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
      optionSelectedBg: '#f5f5f5',
      optionSelectedColor: '#0a0a0a'
    },
    DatePicker: {
      borderRadius: 8,
      controlHeight: 36,
      activeBorderColor: '#0a0a0a',
      hoverBorderColor: '#0a0a0a'
    },
    Table: {
      borderRadius: 10,
      headerBg: '#fafafa',
      headerColor: '#0a0a0a',
      headerSplitColor: '#ededed',
      borderColor: '#ededed',
      rowHoverBg: '#fafafa',
      cellPaddingBlock: 11,
      cellPaddingInline: 14,
      headerBorderRadius: 10
    },
    Tag: {
      borderRadiusSM: 6,
      defaultBg: '#fafafa',
      defaultColor: '#262626'
    },
    Modal: {
      borderRadiusLG: 12,
      headerBg: '#ffffff',
      titleFontSize: 16
    },
    Drawer: {
      borderRadiusLG: 0
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 26
    },
    Steps: {
      colorPrimary: '#0a0a0a',
      iconSize: 28,
      titleLineHeight: 28,
      dotSize: 8
    },
    Form: {
      labelColor: '#0a0a0a',
      labelFontSize: 13,
      verticalLabelPadding: '0 0 4px',
      itemMarginBottom: 16
    },
    Tabs: {
      itemSelectedColor: '#0a0a0a',
      inkBarColor: '#0a0a0a',
      itemHoverColor: '#0a0a0a',
      titleFontSize: 13
    },
    Tooltip: {
      colorBgSpotlight: '#0a0a0a',
      colorTextLightSolid: '#ffffff'
    },
    Segmented: {
      itemSelectedBg: '#0a0a0a',
      itemSelectedColor: '#ffffff',
      borderRadius: 8
    },
    Checkbox: {
      colorPrimary: '#0a0a0a',
      colorPrimaryHover: '#262626'
    },
    Switch: {
      colorPrimary: '#0a0a0a',
      colorPrimaryHover: '#262626'
    },
    Radio: {
      colorPrimary: '#0a0a0a',
      buttonSolidCheckedBg: '#0a0a0a'
    },
    Progress: {
      defaultColor: '#0a0a0a'
    },
    Pagination: {
      itemActiveBg: '#0a0a0a',
      itemActiveColorDisabled: '#ffffff'
    },
    Breadcrumb: {
      itemColor: '#737373',
      linkColor: '#525252',
      linkHoverColor: '#0a0a0a',
      lastItemColor: '#0a0a0a',
      separatorColor: '#a3a3a3'
    },
    Dropdown: {
      borderRadiusLG: 10,
      controlItemBgHover: '#f5f5f5'
    },
    Avatar: {
      colorTextLightSolid: '#ffffff'
    }
  }
};
