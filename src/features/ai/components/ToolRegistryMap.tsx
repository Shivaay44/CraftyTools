import React from 'react';

// Image widgets
import { ImageCompressorWidget } from '../../image/components/ImageCompressorWidget';
import { ImageResizerWidget } from '../../image/components/ImageResizerWidget';
import { ImageToPdfWidget } from '../../image/components/ImageToPdfWidget';
import { ImageFormatConverterWidget } from '../../image/components/ImageFormatConverterWidget';
import { ImageUpscalerWidget } from '../../image/components/ImageUpscalerWidget';
import { ImageColorPaletteWidget } from '../../image/components/ImageColorPaletteWidget';
import { ImageFiltersWidget } from '../../image/components/ImageFiltersWidget';
import { ImageCropperWidget } from '../../image/components/ImageCropperWidget';
import { ExifRemoverWidget } from '../../image/components/ExifRemoverWidget';
import { ImageWatermarkWidget } from '../../image/components/ImageWatermarkWidget';
import { SvgToPngWidget } from '../../image/components/SvgToPngWidget';
import { YoutubeThumbnailDownloaderWidget } from '../../image/components/YoutubeThumbnailDownloaderWidget';
import { SignatureMakerWidget } from '../../image/components/SignatureMakerWidget';
import { MemeGeneratorWidget } from '../../image/components/MemeGeneratorWidget';

// PDF widgets
import { MergePdfWidget } from '../../pdf/components/MergePdfWidget';
import { SplitPdfWidget } from '../../pdf/components/SplitPdfWidget';
import { PdfToImagesWidget } from '../../pdf/components/PdfToImagesWidget';
import { RotatePdfWidget } from '../../pdf/components/RotatePdfWidget';
import { RemovePdfPagesWidget } from '../../pdf/components/RemovePdfPagesWidget';
import { PdfPageNumbererWidget } from '../../pdf/components/PdfPageNumbererWidget';

// Video & Audio widgets
import { VideoToJpgWidget } from '../../video/components/VideoToJpgWidget';
import { VideoFrameIncreaserWidget } from '../../video/components/VideoFrameIncreaserWidget';
import { ScreenRecorderWidget } from '../../video/components/ScreenRecorderWidget';
import { VoiceRecorderWidget } from '../../video/components/VoiceRecorderWidget';

// Calculator widgets
import { AgeCalculatorWidget } from '../../calculator/components/AgeCalculatorWidget';
import { BmiCalculatorWidget } from '../../calculator/components/BmiCalculatorWidget';
import { UnitConverterWidget } from '../../calculator/components/UnitConverterWidget';
import { LoanEmiCalculatorWidget } from '../../calculator/components/LoanEmiCalculatorWidget';
import { PercentageCalculatorWidget } from '../../calculator/components/PercentageCalculatorWidget';

// Text widgets
import { PasswordGeneratorWidget } from '../../text/components/PasswordGeneratorWidget';
import { WordCounterWidget } from '../../text/components/WordCounterWidget';
import { CaseConverterWidget } from '../../text/components/CaseConverterWidget';
import { LoremIpsumWidget } from '../../text/components/LoremIpsumWidget';
import { TextDiffWidget } from '../../text/components/TextDiffWidget';
import { DuplicateRemoverWidget } from '../../text/components/DuplicateRemoverWidget';
import { MarkdownPreviewWidget } from '../../text/components/MarkdownPreviewWidget';
import { TextToBinaryWidget } from '../../text/components/TextToBinaryWidget';

// Developer widgets
import { JsonFormatterWidget } from '../../developer/components/JsonFormatterWidget';
import { Base64EncoderWidget } from '../../developer/components/Base64EncoderWidget';
import { QrCodeGeneratorWidget } from '../../developer/components/QrCodeGeneratorWidget';
import { UuidGeneratorWidget } from '../../developer/components/UuidGeneratorWidget';
import { HashGeneratorWidget } from '../../developer/components/HashGeneratorWidget';
import { JwtDecoderWidget } from '../../developer/components/JwtDecoderWidget';
import { UrlEncoderDecoderWidget } from '../../developer/components/UrlEncoderDecoderWidget';
import { ColorConverterWidget } from '../../developer/components/ColorConverterWidget';
import { CssGlassmorphismWidget } from '../../developer/components/CssGlassmorphismWidget';
import { SvgOptimizerWidget } from '../../developer/components/SvgOptimizerWidget';
import { TimestampConverterWidget } from '../../developer/components/TimestampConverterWidget';
import { RegexTesterWidget } from '../../developer/components/RegexTesterWidget';
import { CronGeneratorWidget } from '../../developer/components/CronGeneratorWidget';
import { CsvJsonConverterWidget } from '../../developer/components/CsvJsonConverterWidget';
import { CssGradientGeneratorWidget } from '../../developer/components/CssGradientGeneratorWidget';
import { MetaTagGeneratorWidget } from '../../developer/components/MetaTagGeneratorWidget';
import { HtmlEntityEncoderWidget } from '../../developer/components/HtmlEntityEncoderWidget';
import { SqlFormatterWidget } from '../../developer/components/SqlFormatterWidget';

interface ToolIslandRendererProps {
  toolSlug: string;
}

export const ToolIslandRenderer: React.FC<ToolIslandRendererProps> = ({ toolSlug }) => {
  // Client-side image tool components
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

  // Client-side PDF tool components
  if (toolSlug === 'merge-pdf') return <MergePdfWidget />;
  if (toolSlug === 'split-pdf') return <SplitPdfWidget />;
  if (toolSlug === 'pdf-to-images') return <PdfToImagesWidget />;
  if (toolSlug === 'rotate-pdf') return <RotatePdfWidget />;
  if (toolSlug === 'remove-pdf-pages') return <RemovePdfPagesWidget />;
  if (toolSlug === 'pdf-page-numberer') return <PdfPageNumbererWidget />;

  // Client-side Video & Audio tool components
  if (toolSlug === 'video-to-jpg') return <VideoToJpgWidget />;
  if (toolSlug === 'video-frame-increaser') return <VideoFrameIncreaserWidget />;
  if (toolSlug === 'screen-recorder') return <ScreenRecorderWidget />;
  if (toolSlug === 'voice-recorder') return <VoiceRecorderWidget />;

  // Client-side Calculator tool components
  if (toolSlug === 'age-calculator') return <AgeCalculatorWidget />;
  if (toolSlug === 'bmi-calculator') return <BmiCalculatorWidget />;
  if (toolSlug === 'unit-converter') return <UnitConverterWidget />;
  if (toolSlug === 'loan-emi-calculator') return <LoanEmiCalculatorWidget />;
  if (toolSlug === 'percentage-calculator') return <PercentageCalculatorWidget />;

  // Client-side Text tool components
  if (toolSlug === 'password-generator') return <PasswordGeneratorWidget />;
  if (toolSlug === 'word-character-counter') return <WordCounterWidget />;
  if (toolSlug === 'case-converter') return <CaseConverterWidget />;
  if (toolSlug === 'lorem-ipsum-generator') return <LoremIpsumWidget />;
  if (toolSlug === 'text-diff-checker') return <TextDiffWidget />;
  if (toolSlug === 'duplicate-line-remover') return <DuplicateRemoverWidget />;
  if (toolSlug === 'markdown-previewer') return <MarkdownPreviewWidget />;
  if (toolSlug === 'text-to-binary') return <TextToBinaryWidget />;

  // Client-side Developer tool components
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
