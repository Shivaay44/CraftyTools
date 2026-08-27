import React, { Suspense, lazy } from 'react';

// Client-side dynamic lazy-loaded Image widgets
const ImageCompressorWidget = lazy(() => import('../../image/components/ImageCompressorWidget').then(m => ({ default: m.ImageCompressorWidget })));
const ImageResizerWidget = lazy(() => import('../../image/components/ImageResizerWidget').then(m => ({ default: m.ImageResizerWidget })));
const ImageToPdfWidget = lazy(() => import('../../image/components/ImageToPdfWidget').then(m => ({ default: m.ImageToPdfWidget })));
const ImageFormatConverterWidget = lazy(() => import('../../image/components/ImageFormatConverterWidget').then(m => ({ default: m.ImageFormatConverterWidget })));
const ImageUpscalerWidget = lazy(() => import('../../image/components/ImageUpscalerWidget').then(m => ({ default: m.ImageUpscalerWidget })));
const ImageColorPaletteWidget = lazy(() => import('../../image/components/ImageColorPaletteWidget').then(m => ({ default: m.ImageColorPaletteWidget })));
const ImageFiltersWidget = lazy(() => import('../../image/components/ImageFiltersWidget').then(m => ({ default: m.ImageFiltersWidget })));
const ImageCropperWidget = lazy(() => import('../../image/components/ImageCropperWidget').then(m => ({ default: m.ImageCropperWidget })));
const ExifRemoverWidget = lazy(() => import('../../image/components/ExifRemoverWidget').then(m => ({ default: m.ExifRemoverWidget })));
const ImageWatermarkWidget = lazy(() => import('../../image/components/ImageWatermarkWidget').then(m => ({ default: m.ImageWatermarkWidget })));
const SvgToPngWidget = lazy(() => import('../../image/components/SvgToPngWidget').then(m => ({ default: m.SvgToPngWidget })));
const YoutubeThumbnailDownloaderWidget = lazy(() => import('../../image/components/YoutubeThumbnailDownloaderWidget').then(m => ({ default: m.YoutubeThumbnailDownloaderWidget })));
const SignatureMakerWidget = lazy(() => import('../../image/components/SignatureMakerWidget').then(m => ({ default: m.SignatureMakerWidget })));
const MemeGeneratorWidget = lazy(() => import('../../image/components/MemeGeneratorWidget').then(m => ({ default: m.MemeGeneratorWidget })));

// Client-side dynamic lazy-loaded PDF widgets
const MergePdfWidget = lazy(() => import('../../pdf/components/MergePdfWidget').then(m => ({ default: m.MergePdfWidget })));
const SplitPdfWidget = lazy(() => import('../../pdf/components/SplitPdfWidget').then(m => ({ default: m.SplitPdfWidget })));
const PdfToImagesWidget = lazy(() => import('../../pdf/components/PdfToImagesWidget').then(m => ({ default: m.PdfToImagesWidget })));
const RotatePdfWidget = lazy(() => import('../../pdf/components/RotatePdfWidget').then(m => ({ default: m.RotatePdfWidget })));
const RemovePdfPagesWidget = lazy(() => import('../../pdf/components/RemovePdfPagesWidget').then(m => ({ default: m.RemovePdfPagesWidget })));
const PdfPageNumbererWidget = lazy(() => import('../../pdf/components/PdfPageNumbererWidget').then(m => ({ default: m.PdfPageNumbererWidget })));

// Client-side dynamic lazy-loaded Video & Audio widgets
const VideoToJpgWidget = lazy(() => import('../../video/components/VideoToJpgWidget').then(m => ({ default: m.VideoToJpgWidget })));
const VideoFrameIncreaserWidget = lazy(() => import('../../video/components/VideoFrameIncreaserWidget').then(m => ({ default: m.VideoFrameIncreaserWidget })));
const ScreenRecorderWidget = lazy(() => import('../../video/components/ScreenRecorderWidget').then(m => ({ default: m.ScreenRecorderWidget })));
const VoiceRecorderWidget = lazy(() => import('../../video/components/VoiceRecorderWidget').then(m => ({ default: m.VoiceRecorderWidget })));

// Client-side dynamic lazy-loaded Calculator widgets
const AgeCalculatorWidget = lazy(() => import('../../calculator/components/AgeCalculatorWidget').then(m => ({ default: m.AgeCalculatorWidget })));
const BmiCalculatorWidget = lazy(() => import('../../calculator/components/BmiCalculatorWidget').then(m => ({ default: m.BmiCalculatorWidget })));
const UnitConverterWidget = lazy(() => import('../../calculator/components/UnitConverterWidget').then(m => ({ default: m.UnitConverterWidget })));
const LoanEmiCalculatorWidget = lazy(() => import('../../calculator/components/LoanEmiCalculatorWidget').then(m => ({ default: m.LoanEmiCalculatorWidget })));
const PercentageCalculatorWidget = lazy(() => import('../../calculator/components/PercentageCalculatorWidget').then(m => ({ default: m.PercentageCalculatorWidget })));

// Client-side dynamic lazy-loaded Text widgets
const PasswordGeneratorWidget = lazy(() => import('../../text/components/PasswordGeneratorWidget').then(m => ({ default: m.PasswordGeneratorWidget })));
const WordCounterWidget = lazy(() => import('../../text/components/WordCounterWidget').then(m => ({ default: m.WordCounterWidget })));
const CaseConverterWidget = lazy(() => import('../../text/components/CaseConverterWidget').then(m => ({ default: m.CaseConverterWidget })));
const LoremIpsumWidget = lazy(() => import('../../text/components/LoremIpsumWidget').then(m => ({ default: m.LoremIpsumWidget })));
const TextDiffWidget = lazy(() => import('../../text/components/TextDiffWidget').then(m => ({ default: m.TextDiffWidget })));
const DuplicateRemoverWidget = lazy(() => import('../../text/components/DuplicateRemoverWidget').then(m => ({ default: m.DuplicateRemoverWidget })));
const MarkdownPreviewWidget = lazy(() => import('../../text/components/MarkdownPreviewWidget').then(m => ({ default: m.MarkdownPreviewWidget })));
const TextToBinaryWidget = lazy(() => import('../../text/components/TextToBinaryWidget').then(m => ({ default: m.TextToBinaryWidget })));

// Client-side dynamic lazy-loaded Developer widgets
const JsonFormatterWidget = lazy(() => import('../../developer/components/JsonFormatterWidget').then(m => ({ default: m.JsonFormatterWidget })));
const Base64EncoderWidget = lazy(() => import('../../developer/components/Base64EncoderWidget').then(m => ({ default: m.Base64EncoderWidget })));
const QrCodeGeneratorWidget = lazy(() => import('../../developer/components/QrCodeGeneratorWidget').then(m => ({ default: m.QrCodeGeneratorWidget })));
const UuidGeneratorWidget = lazy(() => import('../../developer/components/UuidGeneratorWidget').then(m => ({ default: m.UuidGeneratorWidget })));
const HashGeneratorWidget = lazy(() => import('../../developer/components/HashGeneratorWidget').then(m => ({ default: m.HashGeneratorWidget })));
const JwtDecoderWidget = lazy(() => import('../../developer/components/JwtDecoderWidget').then(m => ({ default: m.JwtDecoderWidget })));
const UrlEncoderDecoderWidget = lazy(() => import('../../developer/components/UrlEncoderDecoderWidget').then(m => ({ default: m.UrlEncoderDecoderWidget })));
const ColorConverterWidget = lazy(() => import('../../developer/components/ColorConverterWidget').then(m => ({ default: m.ColorConverterWidget })));
const CssGlassmorphismWidget = lazy(() => import('../../developer/components/CssGlassmorphismWidget').then(m => ({ default: m.CssGlassmorphismWidget })));
const SvgOptimizerWidget = lazy(() => import('../../developer/components/SvgOptimizerWidget').then(m => ({ default: m.SvgOptimizerWidget })));
const TimestampConverterWidget = lazy(() => import('../../developer/components/TimestampConverterWidget').then(m => ({ default: m.TimestampConverterWidget })));
const RegexTesterWidget = lazy(() => import('../../developer/components/RegexTesterWidget').then(m => ({ default: m.RegexTesterWidget })));
const CronGeneratorWidget = lazy(() => import('../../developer/components/CronGeneratorWidget').then(m => ({ default: m.CronGeneratorWidget })));
const CsvJsonConverterWidget = lazy(() => import('../../developer/components/CsvJsonConverterWidget').then(m => ({ default: m.CsvJsonConverterWidget })));
const CssGradientGeneratorWidget = lazy(() => import('../../developer/components/CssGradientGeneratorWidget').then(m => ({ default: m.CssGradientGeneratorWidget })));
const MetaTagGeneratorWidget = lazy(() => import('../../developer/components/MetaTagGeneratorWidget').then(m => ({ default: m.MetaTagGeneratorWidget })));
const HtmlEntityEncoderWidget = lazy(() => import('../../developer/components/HtmlEntityEncoderWidget').then(m => ({ default: m.HtmlEntityEncoderWidget })));
const SqlFormatterWidget = lazy(() => import('../../developer/components/SqlFormatterWidget').then(m => ({ default: m.SqlFormatterWidget })));

interface ToolIslandRendererProps {
  toolSlug: string;
}

export const ToolIslandRenderer: React.FC<ToolIslandRendererProps> = ({ toolSlug }) => {
  const renderWidget = () => {
    // Image tool components
    if (toolSlug === 'image-compressor') return <ImageCompressorWidget />;
    if (toolSlug === 'image-resizer') return <ImageResizerWidget />;
    if (toolSlug === 'image-to-pdf') return <ImageToPdfWidget />;
    if (toolSlug === 'image-format-converter') return <ImageFormatConverterWidget />;
    if (toolSlug === 'image-upscaler') return <ImageUpscalerWidget />;
    if (toolSlug === 'image-color-palette') return <ImageColorPaletteWidget />;
    if (toolSlug === 'image-filters') return <ImageFiltersWidget />;
    if (toolSlug === 'image-cropper') return <ImageCropperWidget />;
    if (toolSlug === 'exif-remover') return <ExifRemoverWidget />;
    if (toolSlug === 'image-watermark') return <ImageWatermarkWidget />;
    if (toolSlug === 'svg-to-png') return <SvgToPngWidget />;
    if (toolSlug === 'youtube-thumbnail-downloader') return <YoutubeThumbnailDownloaderWidget />;
    if (toolSlug === 'signature-maker') return <SignatureMakerWidget />;
    if (toolSlug === 'meme-generator') return <MemeGeneratorWidget />;

    // PDF tool components
    if (toolSlug === 'merge-pdf') return <MergePdfWidget />;
    if (toolSlug === 'split-pdf') return <SplitPdfWidget />;
    if (toolSlug === 'pdf-to-images') return <PdfToImagesWidget />;
    if (toolSlug === 'rotate-pdf') return <RotatePdfWidget />;
    if (toolSlug === 'remove-pdf-pages') return <RemovePdfPagesWidget />;
    if (toolSlug === 'pdf-page-numberer') return <PdfPageNumbererWidget />;

    // Video & Audio tool components
    if (toolSlug === 'video-to-jpg') return <VideoToJpgWidget />;
    if (toolSlug === 'video-frame-increaser') return <VideoFrameIncreaserWidget />;
    if (toolSlug === 'screen-recorder') return <ScreenRecorderWidget />;
    if (toolSlug === 'voice-recorder') return <VoiceRecorderWidget />;

    // Calculator tool components
    if (toolSlug === 'age-calculator') return <AgeCalculatorWidget />;
    if (toolSlug === 'bmi-calculator') return <BmiCalculatorWidget />;
    if (toolSlug === 'unit-converter') return <UnitConverterWidget />;
    if (toolSlug === 'loan-emi-calculator') return <LoanEmiCalculatorWidget />;
    if (toolSlug === 'percentage-calculator') return <PercentageCalculatorWidget />;

    // Text tool components
    if (toolSlug === 'password-generator') return <PasswordGeneratorWidget />;
    if (toolSlug === 'word-character-counter') return <WordCounterWidget />;
    if (toolSlug === 'case-converter') return <CaseConverterWidget />;
    if (toolSlug === 'lorem-ipsum-generator') return <LoremIpsumWidget />;
    if (toolSlug === 'text-diff-checker') return <TextDiffWidget />;
    if (toolSlug === 'duplicate-line-remover') return <DuplicateRemoverWidget />;
    if (toolSlug === 'markdown-previewer') return <MarkdownPreviewWidget />;
    if (toolSlug === 'text-to-binary') return <TextToBinaryWidget />;

    // Developer tool components
    if (toolSlug === 'json-formatter') return <JsonFormatterWidget />;
    if (toolSlug === 'base64-encoder') return <Base64EncoderWidget />;
    if (toolSlug === 'qr-code-generator') return <QrCodeGeneratorWidget />;
    if (toolSlug === 'uuid-generator') return <UuidGeneratorWidget />;
    if (toolSlug === 'hash-generator') return <HashGeneratorWidget />;
    if (toolSlug === 'jwt-decoder') return <JwtDecoderWidget />;
    if (toolSlug === 'url-encoder-decoder') return <UrlEncoderDecoderWidget />;
    if (toolSlug === 'color-converter') return <ColorConverterWidget />;
    if (toolSlug === 'css-glassmorphism-generator') return <CssGlassmorphismWidget />;
    if (toolSlug === 'svg-optimizer') return <SvgOptimizerWidget />;
    if (toolSlug === 'timestamp-converter') return <TimestampConverterWidget />;
    if (toolSlug === 'regex-tester') return <RegexTesterWidget />;
    if (toolSlug === 'cron-generator') return <CronGeneratorWidget />;
    if (toolSlug === 'csv-json-converter') return <CsvJsonConverterWidget />;
    if (toolSlug === 'css-gradient-generator') return <CssGradientGeneratorWidget />;
    if (toolSlug === 'meta-tag-generator') return <MetaTagGeneratorWidget />;
    if (toolSlug === 'html-entity-encoder') return <HtmlEntityEncoderWidget />;
    if (toolSlug === 'sql-formatter') return <SqlFormatterWidget />;

    return (
      <div className="p-6 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
        Tool component for "{toolSlug}" is coming soon!
      </div>
    );
  };

  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 space-y-4 min-h-[300px]">
          <div className="w-9 h-9 rounded-full border-3 border-purple-600 border-t-transparent animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
            Loading tool workspace...
          </span>
        </div>
      }
    >
      {renderWidget()}
    </Suspense>
  );
};
