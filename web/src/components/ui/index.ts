/* 디자인 시스템 공개 API.
 *
 * 화면 코드는 항상 여기서만 가져온다 —  import { Card, Input } from "@/components/ui"
 * 개별 파일 경로를 직접 import 하면 나중에 파일을 쪼개거나 합칠 때 전부 고쳐야 한다.
 */

export { Badge, type BadgeProps } from "./Badge";
export { Button, type ButtonProps } from "./Button";
export {
  Card,
  CardBody,
  CardDescription,
  CardEyebrow,
  CardFooter,
  CardHeader,
  CardNote,
  CardTitle,
  type CardProps,
} from "./Card";
export { DataRow, type DataRowProps } from "./DataRow";
export { Drawer, DrawerDescription, DrawerTitle, type DrawerProps } from "./Drawer";
export {
  Field,
  FieldError,
  FieldHint,
  FieldLabel,
  useFieldControl,
  type FieldProps,
} from "./Field";
export { Input, type InputProps } from "./Input";
export { DivergingBar, Meter, type DivergingBarProps, type MeterProps } from "./Meter";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectOption,
  type SelectProps,
} from "./Select";
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from "./SegmentedControl";
export { Slider, type SliderProps } from "./Slider";
export { Tooltip, TooltipProvider, type TooltipProps } from "./Tooltip";
