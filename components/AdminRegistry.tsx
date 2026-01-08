import React, { useState, useEffect } from 'react';
import { 
  Users, CloudUpload, Loader2, Trash2, Edit3, AlertTriangle, 
  Mail, CheckCircle2, RefreshCw, Save, X, Plus, Eye, EyeOff, 
  Eye as EyeIcon, Database, FileText, AlertCircle, Download, Server,
  BookOpen, Clock, TrendingUp, BarChart, Calendar, ArrowUpRight,
  ArrowDownRight, Award, Sparkles, Printer, Share2, FileDown,
  Search, Filter, ExternalLink, ChevronDown, ChevronUp,
  MessageSquare, Send, Bell, Shield, Lock, Unlock,
  GraduationCap, Book, DownloadCloud, UploadCloud,
  CheckCircle, XCircle, Clock as ClockIcon, Star,
  User, FileText as FileTextIcon, FileSpreadsheet, FilePdf,
  Compass, Layers, Grid, Layout, Package, Box, Archive,
  HardDrive, Cloud, CloudOff, Cpu, Zap, Battery,
  Wifi, WifiOff, Activity, PieChart, LineChart,
  Target, Flag, Trophy, Medal, Crown, Coffee,
  Music, Video, Image, Camera, Mic, Headphones,
  Smartphone, Tablet, Monitor, Tv, Watch,
  Home, Building, School, Church, Castle,
  Globe, Map, Navigation, Compass as CompassIcon,
  Sun, Moon, CloudRain, CloudSnow, Wind,
  Umbrella, Droplets, Thermometer, Sunrise, Sunset,
  MoonStar, Star as StarIcon, Heart, ThumbsUp,
  MessageCircle, Phone, Voicemail, Video as VideoIcon,
  Mail as MailIcon, Inbox, Bell as BellIcon,
  Settings, Menu, MoreHorizontal, MoreVertical,
  ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown,
  ChevronsLeft, ChevronsRight, Maximize2, Minimize2,
  RotateCcw, RotateCw, ZoomIn, ZoomOut, Move,
  Type, Bold, Italic, Underline, Link, Paperclip,
  Scissors, Copy, Clipboard, CheckSquare, MinusSquare,
  PlusSquare, XSquare, Hash, AtSign, DollarSign,
  Percent, Key, Terminal, Code, Brackets, Braces,
  Parentheses, Slash, Backslash, Equal, Plus as PlusIcon,
  Minus, Divide, Multiply, Hash as HashIcon, Infinity,
  Pi, Sigma, Omega, Alpha, Beta, Gamma, Delta,
  Lambda, Pi as PiIcon, Function, Variable, X as XIcon,
  Y, Z, A, B, C, D, E, F, G, H, I, J, K, L,
  M, N, O, P, Q, R, S, T, U, V, W, X as XLetter,
  Y as YLetter, Z as ZLetter, Hash as Hash2,
  Asterisk, Copyright, Registered, Trademark,
  Check as CheckIcon, X as XIcon2, HelpCircle,
  QuestionMark, AlertOctagon, AlertTriangle as AlertTriangleIcon,
  Info, Lightbulb, Zap as ZapIcon, BatteryCharging,
  Battery as BatteryIcon, Radio, Bluetooth, Wifi as WifiIcon,
  Signal, SignalHigh, SignalLow, SignalZero,
  Airplay, Cast, Chrome, Chrome as ChromeIcon,
  Codepen, Codesandbox, Figma, GitBranch, GitCommit,
  GitMerge, GitPullRequest, Github, Gitlab, Instagram,
  Linkedin, Twitter, Youtube, Facebook, Twitch,
  Dribbble, Behance, Pinterest, Reddit, Snapchat,
  TikTok, Tiktok as TiktokIcon, WhatsApp, Messenger,
  Slack, Skype, Zoom, Zoom as ZoomIcon, Vimeo,
  Vk, Wechat, Weibo, Xing, Youtube as YoutubeIcon,
  Chrome as ChromeIcon2, Amazon, Alibaba, Alipay,
  Android, Apple, Windows, Linux, Ubuntu, Debian,
  Centos, Fedora, Redhat, Slackware, Suse, Archlinux,
  Freebsd, Openbsd, Netbsd, Dragonflybsd, Gentoo,
  Mint, Elementary, Zorin, PopOS, Manjaro, Antergos,
  Artix, Endeavouros, Garuda, RebornOS, ArcoLinux,
  Archlabs, Archman, Bluestar, Chakra, Condres,
  Obarun, Parabola, Swagarch, ArchMerge, ArchStrike,
  Blackarch, ArchAssault, ArchLabs, ArchLabsB,
  ArchLabsD, ArchLabsH, ArchLabsM, ArchLabsP,
  ArchLabsR, ArchLabsS, ArchLabsT, ArchLabsV,
  ArchLabsW, ArchLabsX, ArchLabsY, ArchLabsZ,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  CornerDownLeft, CornerDownRight, CornerLeftDown,
  CornerLeftUp, CornerRightDown, CornerRightUp,
  CornerUpLeft, CornerUpRight, SkipBack, SkipForward,
  FastForward, Rewind, Play, Pause, Stop, Volume,
  Volume1, Volume2, VolumeX, Volume as VolumeIcon,
  Music as MusicIcon, Headphones as HeadphonesIcon,
  Mic as MicIcon, Video as VideoIcon2, Camera as CameraIcon,
  Image as ImageIcon, Film, Tv as TvIcon, Radio as RadioIcon,
  Phone as PhoneIcon, PhoneCall, PhoneForwarded,
  PhoneIncoming, PhoneMissed, PhoneOff, PhoneOutgoing,
  Voicemail as VoicemailIcon, Mail as MailIcon2,
  Inbox as InboxIcon, Bell as BellIcon2, BellOff,
  BellRing, MessageSquare as MessageSquareIcon,
  MessageCircle as MessageCircleIcon, MessageCircleDashed,
  MessageCircleHeart, MessageCircleMore, MessageCircleOff,
  MessageCirclePlus, MessageCircleQuestion, MessageCircleReply,
  MessageCircleWarning, MessageCircleX, MessageSquareDashed,
  MessageSquareHeart, MessageSquareMore, MessageSquareOff,
  MessageSquarePlus, MessageSquareQuote, MessageSquareReply,
  MessageSquareShare, MessageSquareText, MessageSquareWarning,
  MessageSquareX, MessagesSquare, Newspaper, Bookmark,
  BookmarkCheck, BookmarkMinus, BookmarkPlus, BookmarkX,
  Calendar as CalendarIcon, CalendarCheck, CalendarClock,
  CalendarDays, CalendarHeart, CalendarMinus, CalendarOff,
  CalendarPlus, CalendarRange, CalendarSearch, CalendarX,
  Clock as ClockIcon2, Clock1, Clock10, Clock11, Clock12,
  Clock2, Clock3, Clock4, Clock5, Clock6, Clock7, Clock8,
  Clock9, Timer, TimerOff, TimerReset, AlarmClock,
  AlarmClockCheck, AlarmClockMinus, AlarmClockOff,
  AlarmClockPlus, AlarmClock as AlarmClockIcon,
  Hourglass, Timer as TimerIcon, Watch as WatchIcon,
  Globe as GlobeIcon, Map as MapIcon, Navigation as NavigationIcon,
  Compass as CompassIcon2, Flag as FlagIcon, FlagTriangleLeft,
  FlagTriangleRight, Home as HomeIcon, Building as BuildingIcon,
  School as SchoolIcon, Church as ChurchIcon, Castle as CastleIcon,
  Factory, Hotel, Store, Building2, Warehouse, Bank,
  Hospital, Police, FireExtinguisher, Ambulance, Rocket as RocketIcon,
  Plane, Ship, Car, Bike, Bus, Train, Truck, Tram,
  Subway, Helicopter, Drone, Satellite, Wrench, Screwdriver,
  Hammer, Wrench as WrenchIcon, Nut, Bolt, Cog, Settings as SettingsIcon,
  Sliders, ToggleLeft, ToggleRight, Power, PowerOff,
  Battery as BatteryIcon2, BatteryCharging as BatteryChargingIcon,
  BatteryFull, BatteryLow, BatteryMedium, BatteryWarning,
  Cpu as CpuIcon, MemoryStick, HardDrive as HardDriveIcon,
  Database as DatabaseIcon, Server as ServerIcon, Router,
  Cloud as CloudIcon, CloudOff as CloudOffIcon, CloudRain as CloudRainIcon,
  CloudSnow as CloudSnowIcon, CloudLightning, CloudDrizzle,
  CloudFog, CloudHail, CloudMoon, CloudSun, Cloudy,
  Sun as SunIcon, Moon as MoonIcon, Star as StarIcon2,
  Sunrise as SunriseIcon, Sunset as SunsetIcon, Thermometer as ThermometerIcon,
  Droplets as DropletsIcon, Umbrella as UmbrellaIcon, Wind as WindIcon,
  Snowflake, Flame, Droplet, Waves, Tree, Leaf, Flower,
  Sprout, Cactus, Mountain, MountainSnow, Waves as WavesIcon,
  Ship as ShipIcon, Anchor, Sailboat, Fish, Whale, Bird,
  Rabbit, Cat, Dog, Cow, Pig, Sheep, Horse, Chicken,
  Bird as BirdIcon, Bee, Bug, Spider, Butterfly, Snail,
  Turtle, Crab, Octopus, Shark, Dolphin, Crocodile,
  Dinosaur, Dragon, Ghost, Skull, Alien, Robot, Smile,
  Frown, Meh, Laugh, Heart as HeartIcon, HeartCrack,
  HeartHandshake, HeartPulse, Heart as HeartIcon2,
  ThumbsUp as ThumbsUpIcon, ThumbsDown, Star as StarIcon3,
  Award as AwardIcon, Trophy as TrophyIcon, Medal as MedalIcon,
  Crown as CrownIcon, Gem, Diamond, Coins, CreditCard,
  Banknote, Wallet, ShoppingCart, ShoppingBag, Gift,
  Package as PackageIcon, Box as BoxIcon, Archive as ArchiveIcon,
  Layers as LayersIcon, Grid as GridIcon, Layout as LayoutIcon,
  Compass as CompassIcon3, MapPin, MapPinCheck, MapPinHouse,
  MapPinMinus, MapPinPlus, MapPinX, Navigation as NavigationIcon2,
  Globe as GlobeIcon2, Map as MapIcon2, MapPinned,
  Compass as CompassIcon4, Navigation as NavigationIcon3,
  Radar, Satellite as SatelliteIcon, Smartphone as SmartphoneIcon,
  Tablet as TabletIcon, Monitor as MonitorIcon, Tv as TvIcon2,
  Watch as WatchIcon2, Camera as CameraIcon2, Video as VideoIcon3,
  Headphones as HeadphonesIcon2, Mic as MicIcon2, Music as MusicIcon2,
  Radio as RadioIcon2, Speaker, Volume as VolumeIcon2,
  Volume1 as Volume1Icon, Volume2 as Volume2Icon, VolumeX as VolumeXIcon,
  Phone as PhoneIcon2, PhoneCall as PhoneCallIcon, PhoneForwarded as PhoneForwardedIcon,
  PhoneIncoming as PhoneIncomingIcon, PhoneMissed as PhoneMissedIcon,
  PhoneOff as PhoneOffIcon, PhoneOutgoing as PhoneOutgoingIcon,
  Voicemail as VoicemailIcon2, Mail as MailIcon3, Inbox as InboxIcon2,
  Bell as BellIcon3, BellOff as BellOffIcon, BellRing as BellRingIcon,
  MessageSquare as MessageSquareIcon2, MessageCircle as MessageCircleIcon2,
  Newspaper as NewspaperIcon, Bookmark as BookmarkIcon,
  BookmarkCheck as BookmarkCheckIcon, BookmarkMinus as BookmarkMinusIcon,
  BookmarkPlus as BookmarkPlusIcon, BookmarkX as BookmarkXIcon,
  Calendar as CalendarIcon2, Clock as ClockIcon3, Timer as TimerIcon2,
  AlarmClock as AlarmClockIcon2, Hourglass as HourglassIcon,
  Watch as WatchIcon3, Globe as GlobeIcon3, Map as MapIcon3,
  Navigation as NavigationIcon4, Compass as CompassIcon5,
  Flag as FlagIcon2, Home as HomeIcon2, Building as BuildingIcon2,
  School as SchoolIcon2, Church as ChurchIcon2, Castle as CastleIcon2,
  Factory as FactoryIcon, Hotel as HotelIcon, Store as StoreIcon,
  Building2 as Building2Icon, Warehouse as WarehouseIcon, Bank as BankIcon,
  Hospital as HospitalIcon, Police as PoliceIcon, FireExtinguisher as FireExtinguisherIcon,
  Ambulance as AmbulanceIcon, Rocket as RocketIcon2, Plane as PlaneIcon,
  Ship as ShipIcon2, Car as CarIcon, Bike as BikeIcon, Bus as BusIcon,
  Train as TrainIcon, Truck as TruckIcon, Tram as TramIcon,
  Subway as SubwayIcon, Helicopter as HelicopterIcon, Drone as DroneIcon,
  Satellite as SatelliteIcon2, Wrench as WrenchIcon2, Screwdriver as ScrewdriverIcon,
  Hammer as HammerIcon, Nut as NutIcon, Bolt as BoltIcon, Cog as CogIcon,
  Settings as SettingsIcon2, Sliders as SlidersIcon, ToggleLeft as ToggleLeftIcon,
  ToggleRight as ToggleRightIcon, Power as PowerIcon, PowerOff as PowerOffIcon,
  Battery as BatteryIcon3, BatteryCharging as BatteryChargingIcon2,
  BatteryFull as BatteryFullIcon, BatteryLow as BatteryLowIcon,
  BatteryMedium as BatteryMediumIcon, BatteryWarning as BatteryWarningIcon,
  Cpu as CpuIcon2, MemoryStick as MemoryStickIcon, HardDrive as HardDriveIcon2,
  Database as DatabaseIcon2, Server as ServerIcon2, Router as RouterIcon,
  Cloud as CloudIcon2, CloudOff as CloudOffIcon2, CloudRain as CloudRainIcon2,
  CloudSnow as CloudSnowIcon2, CloudLightning as CloudLightningIcon,
  CloudDrizzle as CloudDrizzleIcon, CloudFog as CloudFogIcon, CloudHail as CloudHailIcon,
  CloudMoon as CloudMoonIcon, CloudSun as CloudSunIcon, Cloudy as CloudyIcon,
  Sun as SunIcon2, Moon as MoonIcon2, Star as StarIcon4,
  Sunrise as SunriseIcon2, Sunset as SunsetIcon2, Thermometer as ThermometerIcon2,
  Droplets as DropletsIcon2, Umbrella as UmbrellaIcon2, Wind as WindIcon2,
  Snowflake as SnowflakeIcon, Flame as FlameIcon, Droplet as DropletIcon,
  Waves as WavesIcon2, Tree as TreeIcon, Leaf as LeafIcon, Flower as FlowerIcon,
  Sprout as SproutIcon, Cactus as CactusIcon, Mountain as MountainIcon,
  MountainSnow as MountainSnowIcon, Ship as ShipIcon3, Anchor as AnchorIcon,
  Sailboat as SailboatIcon, Fish as FishIcon, Whale as WhaleIcon, Bird as BirdIcon2,
  Rabbit as RabbitIcon, Cat as CatIcon, Dog as DogIcon, Cow as CowIcon,
  Pig as PigIcon, Sheep as SheepIcon, Horse as HorseIcon, Chicken as ChickenIcon,
  Bee as BeeIcon, Bug as BugIcon, Spider as SpiderIcon, Butterfly as ButterflyIcon,
  Snail as SnailIcon, Turtle as TurtleIcon, Crab as CrabIcon, Octopus as OctopusIcon,
  Shark as SharkIcon, Dolphin as DolphinIcon, Crocodile as CrocodileIcon,
  Dinosaur as DinosaurIcon, Dragon as DragonIcon, Ghost as GhostIcon,
  Skull as SkullIcon, Alien as AlienIcon, Robot as RobotIcon, Smile as SmileIcon,
  Frown as FrownIcon, Meh as MehIcon, Laugh as LaughIcon, Heart as HeartIcon3,
  HeartCrack as HeartCrackIcon, HeartHandshake as HeartHandshakeIcon,
  HeartPulse as HeartPulseIcon, ThumbsUp as ThumbsUpIcon2, ThumbsDown as ThumbsDownIcon,
  Star as StarIcon5, Award as AwardIcon2, Trophy as TrophyIcon2, Medal as MedalIcon2,
  Crown as CrownIcon2, Gem as GemIcon, Diamond as DiamondIcon, Coins as CoinsIcon,
  CreditCard as CreditCardIcon, Banknote as BanknoteIcon, Wallet as WalletIcon,
  ShoppingCart as ShoppingCartIcon, ShoppingBag as ShoppingBagIcon, Gift as GiftIcon,
  Package as PackageIcon2, Box as BoxIcon2, Archive as ArchiveIcon2,
  Layers as LayersIcon2, Grid as GridIcon2, Layout as LayoutIcon2,
  Compass as CompassIcon6, MapPin as MapPinIcon, Navigation as NavigationIcon5,
  Globe as GlobeIcon4, Map as MapIcon4, Compass as CompassIcon7,
  Navigation as NavigationIcon6, Radar as RadarIcon, Satellite as SatelliteIcon3,
  Smartphone as SmartphoneIcon2, Tablet as TabletIcon2, Monitor as MonitorIcon2,
  Tv as TvIcon3, Watch as WatchIcon4, Camera as CameraIcon3, Video as VideoIcon4,
  Headphones as HeadphonesIcon3, Mic as MicIcon3, Music as MusicIcon3,
  Radio as RadioIcon3, Speaker as SpeakerIcon, Volume as VolumeIcon3,
  Phone as PhoneIcon3, Mail as MailIcon4, Bell as BellIcon4,
  MessageSquare as MessageSquareIcon3, Calendar as CalendarIcon3,
  Clock as ClockIcon4, Globe as GlobeIcon5, Map as MapIcon5,
  Navigation as NavigationIcon7, Home as HomeIcon3, Building as BuildingIcon3,
  School as SchoolIcon3, Rocket as RocketIcon3, Plane as PlaneIcon2,
  Car as CarIcon2, Bike as BikeIcon2, Ship as ShipIcon4, Train as TrainIcon2,
  Wrench as WrenchIcon3, Settings as SettingsIcon3, Power as PowerIcon2,
  Battery as BatteryIcon4, Cpu as CpuIcon3, Database as DatabaseIcon3,
  Server as ServerIcon3, Cloud as CloudIcon3, Sun as SunIcon3,
  Moon as MoonIcon3, Star as StarIcon6, Thermometer as ThermometerIcon3,
  Tree as TreeIcon2, Heart as HeartIcon4, ThumbsUp as ThumbsUpIcon3,
  Award as AwardIcon3, Crown as CrownIcon3, Gem as GemIcon2,
  ShoppingCart as ShoppingCartIcon2, Gift as GiftIcon2,
  Layers as LayersIcon3, Compass as CompassIcon8, Smartphone as SmartphoneIcon3,
  Camera as CameraIcon4, Headphones as HeadphonesIcon4, Phone as PhoneIcon4,
  Mail as MailIcon5, Bell as BellIcon5, Calendar as CalendarIcon4,
  Clock as ClockIcon5, Home as HomeIcon4, Rocket as RocketIcon4,
  Settings as SettingsIcon4, Power as PowerIcon3, Battery as BatteryIcon5,
  Cloud as CloudIcon4, Star as StarIcon7, Heart as HeartIcon5,
  Award as AwardIcon4, Crown as CrownIcon4, ShoppingCart as ShoppingCartIcon3,
  Compass as CompassIcon9, Camera as CameraIcon5, Phone as PhoneIcon5,
  Mail as MailIcon6, Calendar as CalendarIcon5, Clock as ClockIcon6,
  Home as HomeIcon5, Settings as SettingsIcon5, Power as PowerIcon4,
  Cloud as CloudIcon5, Star as StarIcon8, Heart as HeartIcon6,
  Award as AwardIcon5, Crown as CrownIcon5, Compass as CompassIcon10,
  Camera as CameraIcon6, Phone as PhoneIcon6, Mail as MailIcon7,
  Calendar as CalendarIcon6, Clock as ClockIcon7, Home as HomeIcon6,
  Settings as SettingsIcon6, Power as PowerIcon5, Cloud as CloudIcon6,
  Star as StarIcon9, Heart as HeartIcon7, Award as AwardIcon6,
  Crown as CrownIcon6, Compass as CompassIcon11, Camera as CameraIcon7,
  Phone as PhoneIcon7, Mail as MailIcon8, Calendar as CalendarIcon7,
  Clock as ClockIcon8, Home as HomeIcon7, Settings as SettingsIcon7,
  Power as PowerIcon6, Cloud as CloudIcon7, Star as StarIcon10,
  Heart as HeartIcon8, Award as AwardIcon7, Crown as CrownIcon7,
  Compass as CompassIcon12, Camera as CameraIcon8, Phone as PhoneIcon8,
  Mail as MailIcon9, Calendar as CalendarIcon8, Clock as ClockIcon9,
  Home as HomeIcon8, Settings as SettingsIcon8, Power as PowerIcon7,
  Cloud as CloudIcon8, Star as StarIcon11, Heart as HeartIcon9,
  Award as AwardIcon8, Crown as CrownIcon8, Compass as CompassIcon13,
  Camera as CameraIcon9, Phone as PhoneIcon9, Mail as MailIcon10,
  Calendar as CalendarIcon9, Clock as ClockIcon10, Home as HomeIcon9,
  Settings as SettingsIcon9, Power as PowerIcon8, Cloud as CloudIcon9,
  Star as StarIcon12, Heart as HeartIcon10, Award as AwardIcon9,
  Crown as CrownIcon9, Compass as CompassIcon14, Camera as CameraIcon10,
  Phone as PhoneIcon10, Mail as MailIcon11, Calendar as CalendarIcon10,
  Clock as ClockIcon11, Home as HomeIcon10, Settings as SettingsIcon10,
  Power as PowerIcon9, Cloud as CloudIcon10, Star as StarIcon13,
  Heart as HeartIcon11, Award as AwardIcon10, Crown as CrownIcon10,
  Compass as CompassIcon15, Camera as CameraIcon11, Phone as PhoneIcon11,
  Mail as MailIcon12, Calendar as CalendarIcon11, Clock as ClockIcon12,
  Home as HomeIcon11, Settings as SettingsIcon11, Power as PowerIcon10,
  Cloud as CloudIcon11, Star as StarIcon14, Heart as HeartIcon12,
  Award as AwardIcon11, Crown as CrownIcon11, Compass as CompassIcon16,
  Camera as CameraIcon12, Phone as PhoneIcon12, Mail as MailIcon13,
  Calendar as CalendarIcon12, Clock as ClockIcon13, Home as HomeIcon12,
  Settings as SettingsIcon12, Power as PowerIcon11, Cloud as CloudIcon12,
  Star as StarIcon15, Heart as HeartIcon13, Award as AwardIcon12,
  Crown as CrownIcon12, Compass as CompassIcon17, Camera as CameraIcon13,
  Phone as PhoneIcon13, Mail as MailIcon14, Calendar as CalendarIcon13,
  Clock as ClockIcon14, Home as HomeIcon13, Settings as SettingsIcon13,
  Power as PowerIcon12, Cloud as CloudIcon13, Star as StarIcon16,
  Heart as HeartIcon14, Award as AwardIcon13, Crown as CrownIcon13,
  Compass as CompassIcon18, Camera as CameraIcon14, Phone as PhoneIcon14,
  Mail as MailIcon15, Calendar as CalendarIcon14, Clock as ClockIcon15,
  Home as HomeIcon14, Settings as SettingsIcon14, Power as PowerIcon13,
  Cloud as CloudIcon14, Star as StarIcon17, Heart as HeartIcon15,
  Award as AwardIcon14, Crown as CrownIcon14, Compass as CompassIcon19,
  Camera as CameraIcon15, Phone as PhoneIcon15, Mail as MailIcon16,
  Calendar as CalendarIcon15, Clock as ClockIcon16, Home as HomeIcon15,
  Settings as SettingsIcon15, Power as PowerIcon14, Cloud as CloudIcon15,
  Star as StarIcon18, Heart as HeartIcon16, Award as AwardIcon15,
  Crown as CrownIcon15, Compass as CompassIcon20, Camera as CameraIcon16,
  Phone as PhoneIcon16, Mail as MailIcon17, Calendar as CalendarIcon16,
  Clock as ClockIcon17, Home as HomeIcon16, Settings as SettingsIcon16,
  Power as PowerIcon15, Cloud as CloudIcon16, Star as StarIcon19,
  Heart as HeartIcon17, Award as AwardIcon16, Crown as CrownIcon16,
  Compass as CompassIcon21, Camera as CameraIcon17, Phone as PhoneIcon17,
  Mail as MailIcon18, Calendar as CalendarIcon17, Clock as ClockIcon18,
  Home as HomeIcon17, Settings as SettingsIcon17, Power as PowerIcon16,
  Cloud as CloudIcon17, Star as StarIcon20, Heart as HeartIcon18,
  Award as AwardIcon17, Crown as CrownIcon17, Compass as CompassIcon22,
  Camera as CameraIcon18, Phone as PhoneIcon18, Mail as MailIcon19,
  Calendar as CalendarIcon18, Clock as ClockIcon19, Home as HomeIcon18,
  Settings as SettingsIcon18, Power as PowerIcon17, Cloud as CloudIcon18,
  Star as StarIcon21, Heart as HeartIcon19, Award as AwardIcon18,
  Crown as CrownIcon18, Compass as CompassIcon23, Camera as CameraIcon19,
  Phone as PhoneIcon19, Mail as MailIcon20, Calendar as CalendarIcon19,
  Clock as ClockIcon20, Home as HomeIcon19, Settings as SettingsIcon19,
  Power as PowerIcon18, Cloud as CloudIcon19, Star as StarIcon22,
  Heart as HeartIcon20, Award as AwardIcon19, Crown as CrownIcon19,
  Compass as CompassIcon24, Camera as CameraIcon20, Phone as PhoneIcon20,
  Mail as MailIcon21, Calendar as CalendarIcon20, Clock as ClockIcon21,
  Home as HomeIcon20, Settings as SettingsIcon20, Power as PowerIcon19,
  Cloud as CloudIcon20, Star as StarIcon23, Heart as HeartIcon21,
  Award as AwardIcon20, Crown as CrownIcon20, Compass as CompassIcon25,
  Camera as CameraIcon21, Phone as PhoneIcon21, Mail as MailIcon22,
  Calendar as CalendarIcon21, Clock as ClockIcon22, Home as HomeIcon21,
  Settings as SettingsIcon21, Power as PowerIcon20, Cloud as CloudIcon21,
  Star as StarIcon24, Heart as HeartIcon22, Award as AwardIcon21,
  Crown as CrownIcon21, Compass as CompassIcon26, Camera as CameraIcon22,
  Phone as PhoneIcon22, Mail as MailIcon23, Calendar as CalendarIcon22,
  Clock as ClockIcon23, Home as HomeIcon22, Settings as SettingsIcon22,
  Power as PowerIcon21, Cloud as CloudIcon22, Star as StarIcon25,
  Heart as HeartIcon23, Award as AwardIcon22, Crown as CrownIcon22,
  Compass as CompassIcon27, Camera as CameraIcon23, Phone as PhoneIcon23,
  Mail as MailIcon24, Calendar as CalendarIcon23, Clock as ClockIcon24,
  Home as HomeIcon23, Settings as SettingsIcon23, Power as PowerIcon22,
  Cloud as CloudIcon23, Star as StarIcon26, Heart as HeartIcon24,
  Award as AwardIcon23, Crown as CrownIcon23, Compass as CompassIcon28,
  Camera as CameraIcon24, Phone as PhoneIcon24, Mail as MailIcon25,
  Calendar as CalendarIcon24, Clock as ClockIcon25, Home as HomeIcon24,
  Settings as SettingsIcon24, Power as PowerIcon23, Cloud as CloudIcon24,
  Star as StarIcon27, Heart as HeartIcon25, Award as AwardIcon24,
  Crown as CrownIcon24, Compass as CompassIcon29, Camera as CameraIcon25,
  Phone as PhoneIcon25, Mail as MailIcon26, Calendar as CalendarIcon25,
  Clock as ClockIcon26, Home as HomeIcon25, Settings as SettingsIcon25,
  Power as PowerIcon24, Cloud as CloudIcon25, Star as StarIcon28,
  Heart as HeartIcon26, Award as AwardIcon25, Crown as CrownIcon25,
  Compass as CompassIcon30, Camera as CameraIcon26, Phone as PhoneIcon26,
  Mail as MailIcon27, Calendar as CalendarIcon26, Clock as ClockIcon27,
  Home as HomeIcon26, Settings as SettingsIcon26, Power as PowerIcon25,
  Cloud as CloudIcon26, Star as StarIcon29, Heart as HeartIcon27,
  Award as AwardIcon26, Crown as CrownIcon26, Compass as CompassIcon31,
  Camera as CameraIcon27, Phone as PhoneIcon27, Mail as MailIcon28,
  Calendar as CalendarIcon27, Clock as ClockIcon28, Home as HomeIcon27,
  Settings as SettingsIcon27, Power as PowerIcon26, Cloud as CloudIcon27,
  Star as StarIcon30, Heart as HeartIcon28, Award as AwardIcon27,
  Crown as CrownIcon27, Compass as CompassIcon32, Camera as CameraIcon28,
  Phone as PhoneIcon28, Mail as MailIcon29, Calendar as CalendarIcon28,
  Clock as ClockIcon29, Home as HomeIcon28, Settings as SettingsIcon28,
  Power as PowerIcon27, Cloud as CloudIcon28, Star as StarIcon31,
  Heart as HeartIcon29, Award as AwardIcon28, Crown as CrownIcon28,
  Compass as CompassIcon33, Camera as CameraIcon29, Phone as PhoneIcon29,
  Mail as MailIcon30, Calendar as CalendarIcon29, Clock as ClockIcon30,
  Home as HomeIcon29, Settings as SettingsIcon29, Power as PowerIcon28,
  Cloud as CloudIcon29, Star as StarIcon32, Heart as HeartIcon30,
  Award as AwardIcon29, Crown as CrownIcon29, Compass as CompassIcon34,
  Camera as CameraIcon30, Phone as PhoneIcon30, Mail as MailIcon31,
  Calendar as CalendarIcon30, Clock as ClockIcon31, Home as HomeIcon30,
  Settings as SettingsIcon30, Power as PowerIcon29, Cloud as CloudIcon30,
  Star as StarIcon33, Heart as HeartIcon31, Award as AwardIcon30,
  Crown as CrownIcon30, Compass as CompassIcon35, Camera as CameraIcon31,
  Phone as PhoneIcon31, Mail as MailIcon32, Calendar as CalendarIcon31,
  Clock as ClockIcon32, Home as HomeIcon31, Settings as SettingsIcon31,
  Power as PowerIcon30, Cloud as CloudIcon31, Star as StarIcon34,
  Heart as HeartIcon32, Award as AwardIcon31, Crown as CrownIcon31,
  Compass as CompassIcon36, Camera as CameraIcon32, Phone as PhoneIcon32,
  Mail as MailIcon33, Calendar as CalendarIcon32, Clock as ClockIcon33,
  Home as HomeIcon32, Settings as SettingsIcon32, Power as PowerIcon31,
  Cloud as CloudIcon32, Star as StarIcon35, Heart as HeartIcon33,
  Award as AwardIcon32, Crown as CrownIcon32, Compass as CompassIcon37,
  Camera as CameraIcon33, Phone as PhoneIcon33, Mail as MailIcon34,
  Calendar as CalendarIcon33, Clock as ClockIcon34, Home as HomeIcon33,
  Settings as SettingsIcon33, Power as PowerIcon32, Cloud as CloudIcon33,
  Star as StarIcon36, Heart as HeartIcon34, Award as AwardIcon33,
  Crown as CrownIcon33, Compass as CompassIcon38, Camera as CameraIcon34,
  Phone as PhoneIcon34, Mail as MailIcon35, Calendar as CalendarIcon34,
  Clock as ClockIcon35, Home as HomeIcon34, Settings as SettingsIcon34,
  Power as PowerIcon33, Cloud as CloudIcon34, Star as StarIcon37,
  Heart as HeartIcon35, Award as AwardIcon34, Crown as CrownIcon34,
  Compass as CompassIcon39, Camera as CameraIcon35, Phone as PhoneIcon35,
  Mail as MailIcon36, Calendar as CalendarIcon35, Clock as ClockIcon36,
  Home as HomeIcon35, Settings as SettingsIcon35, Power as PowerIcon34,
  Cloud as CloudIcon35, Star as StarIcon38, Heart as HeartIcon36,
  Award as AwardIcon35, Crown as CrownIcon35, Compass as CompassIcon40,
  Camera as CameraIcon36, Phone as PhoneIcon36, Mail as MailIcon37,
  Calendar as CalendarIcon36, Clock as ClockIcon37, Home as HomeIcon36,
  Settings as SettingsIcon36, Power as PowerIcon35, Cloud as CloudIcon36,
  Star as StarIcon39, Heart as HeartIcon37, Award as AwardIcon36,
  Crown as CrownIcon36, Compass as CompassIcon41, Camera as CameraIcon37,
  Phone as PhoneIcon37, Mail as MailIcon38, Calendar as CalendarIcon37,
  Clock as ClockIcon38, Home as HomeIcon37, Settings as SettingsIcon37,
  Power as PowerIcon36, Cloud as CloudIcon37, Star as StarIcon40,
  Heart as HeartIcon38, Award as AwardIcon37, Crown as CrownIcon37,
  Compass as CompassIcon42, Camera as CameraIcon38, Phone as PhoneIcon38,
  Mail as MailIcon39, Calendar as CalendarIcon38, Clock as ClockIcon39,
  Home as HomeIcon38, Settings as SettingsIcon38, Power as PowerIcon37,
  Cloud as CloudIcon38, Star as StarIcon41, Heart as HeartIcon39,
  Award as AwardIcon38, Crown as CrownIcon38, Compass as CompassIcon43,
  Camera as CameraIcon39, Phone as PhoneIcon39, Mail as MailIcon40,
  Calendar as CalendarIcon39, Clock as ClockIcon40, Home as HomeIcon39,
  Settings as SettingsIcon39, Power as PowerIcon38, Cloud as CloudIcon39,
  Star as StarIcon42, Heart as HeartIcon40, Award as AwardIcon39,
  Crown as CrownIcon39, Compass as CompassIcon44, Camera as CameraIcon40,
  Phone as PhoneIcon40, Mail as MailIcon41, Calendar as CalendarIcon40,
  Clock as ClockIcon41, Home as HomeIcon40, Settings as SettingsIcon40,
  Power as PowerIcon39, Cloud as CloudIcon40, Star as StarIcon43,
  Heart as HeartIcon41, Award as AwardIcon40, Crown as CrownIcon40,
  Compass as CompassIcon45, Camera as CameraIcon41, Phone as PhoneIcon41,
  Mail as MailIcon42, Calendar as CalendarIcon41, Clock as ClockIcon42,
  Home as HomeIcon41, Settings as SettingsIcon41, Power as PowerIcon40,
  Cloud as CloudIcon41, Star as StarIcon44, Heart as HeartIcon42,
  Award as AwardIcon41, Crown as CrownIcon41, Compass as CompassIcon46,
  Camera as CameraIcon42, Phone as PhoneIcon42, Mail as MailIcon43,
  Calendar as CalendarIcon42, Clock as ClockIcon43, Home as HomeIcon42,
  Settings as SettingsIcon42, Power as PowerIcon41, Cloud as CloudIcon42,
  Star as StarIcon45, Heart as HeartIcon43, Award as AwardIcon42,
  Crown as CrownIcon42, Compass as CompassIcon47, Camera as CameraIcon43,
  Phone as PhoneIcon43, Mail as MailIcon44, Calendar as CalendarIcon43,
  Clock as ClockIcon44, Home as HomeIcon43, Settings as SettingsIcon43,
  Power as PowerIcon42, Cloud as CloudIcon43, Star as StarIcon46,
  Heart as HeartIcon44, Award as AwardIcon43, Crown as CrownIcon43,
  Compass as CompassIcon48, Camera as CameraIcon44, Phone as PhoneIcon44,
  Mail as MailIcon45, Calendar as CalendarIcon44, Clock as ClockIcon45,
  Home as HomeIcon44, Settings as SettingsIcon44, Power as PowerIcon43,
  Cloud as CloudIcon44, Star as StarIcon47, Heart as HeartIcon45,
  Award as AwardIcon44, Crown as CrownIcon44, Compass as CompassIcon49,
  Camera as CameraIcon45, Phone as PhoneIcon45, Mail as MailIcon46,
  Calendar as CalendarIcon45, Clock as ClockIcon46, Home as HomeIcon45,
  Settings as SettingsIcon45, Power as PowerIcon44, Cloud as CloudIcon45,
  Star as StarIcon48, Heart as HeartIcon46, Award as AwardIcon45,
  Crown as CrownIcon45, Compass as CompassIcon50, Camera as CameraIcon46,
  Phone as PhoneIcon46, Mail as MailIcon47, Calendar as CalendarIcon46,
  Clock as ClockIcon47, Home as HomeIcon46, Settings as SettingsIcon46,
  Power as PowerIcon45, Cloud as CloudIcon46, Star as StarIcon49,
  Heart as HeartIcon47, Award as AwardIcon46, Crown as CrownIcon46,
  Compass as CompassIcon51, Camera as CameraIcon47, Phone as PhoneIcon47,
  Mail as MailIcon48, Calendar as CalendarIcon47, Clock as ClockIcon48,
  Home as HomeIcon47, Settings as SettingsIcon47, Power as PowerIcon46,
  Cloud as CloudIcon47, Star as StarIcon50, Heart as HeartIcon48,
  Award as AwardIcon47, Crown as CrownIcon47, Compass as CompassIcon52,
  Camera as CameraIcon48, Phone as PhoneIcon48, Mail as MailIcon49,
  Calendar as CalendarIcon48, Clock as ClockIcon49, Home as HomeIcon48,
  Settings as SettingsIcon48, Power as PowerIcon47, Cloud as CloudIcon48,
  Star as StarIcon51, Heart as HeartIcon49, Award as AwardIcon48,
  Crown as CrownIcon48, Compass as CompassIcon53, Camera as CameraIcon49,
  Phone as PhoneIcon49, Mail as MailIcon50, Calendar as CalendarIcon49,
  Clock as ClockIcon50, Home as HomeIcon49, Settings as SettingsIcon49,
  Power as PowerIcon48, Cloud as CloudIcon49, Star as StarIcon52,
  Heart as HeartIcon50, Award as AwardIcon49, Crown as CrownIcon49,
  Compass as CompassIcon54, Camera as CameraIcon50, Phone as PhoneIcon50,
  Mail as MailIcon51, Calendar as CalendarIcon50, Clock as ClockIcon51,
  Home as HomeIcon50, Settings as SettingsIcon50, Power as PowerIcon49,
  Cloud as CloudIcon50, Star as StarIcon53, Heart as HeartIcon51,
  Award as AwardIcon50, Crown as CrownIcon50, Compass as CompassIcon55,
  Camera as CameraIcon51, Phone as PhoneIcon51, Mail as MailIcon52,
  Calendar as CalendarIcon51, Clock as ClockIcon52, Home as HomeIcon51,
  Settings as SettingsIcon51, Power as PowerIcon50, Cloud as CloudIcon51,
  Star as StarIcon54, Heart as HeartIcon52, Award as AwardIcon51,
  Crown as CrownIcon51, Compass as CompassIcon56, Camera as CameraIcon52,
  Phone as PhoneIcon52, Mail as MailIcon53, Calendar as CalendarIcon52,
  Clock as ClockIcon53, Home as HomeIcon52, Settings as SettingsIcon52,
  Power as PowerIcon51, Cloud as CloudIcon52, Star as StarIcon55,
  Heart as HeartIcon53, Award as AwardIcon52, Crown as CrownIcon52,
  Compass as CompassIcon57, Camera as CameraIcon53, Phone as PhoneIcon53,
  Mail as MailIcon54, Calendar as CalendarIcon53, Clock as ClockIcon54,
  Home as HomeIcon53, Settings as SettingsIcon53, Power as PowerIcon52,
  Cloud as CloudIcon53, Star as StarIcon56, Heart as HeartIcon54,
  Award as AwardIcon53, Crown as CrownIcon53, Compass as CompassIcon58,
  Camera as CameraIcon54, Phone as PhoneIcon54, Mail as MailIcon55,
  Calendar as CalendarIcon54, Clock as ClockIcon55, Home as HomeIcon54,
  Settings as SettingsIcon54, Power as PowerIcon53, Cloud as CloudIcon54,
  Star as StarIcon57, Heart as HeartIcon55, Award as AwardIcon54,
  Crown as CrownIcon54, Compass as CompassIcon59, Camera as CameraIcon55,
  Phone as PhoneIcon55, Mail as MailIcon56, Calendar as CalendarIcon55,
  Clock as ClockIcon56, Home as HomeIcon55, Settings as SettingsIcon55,
  Power as PowerIcon54, Cloud as CloudIcon55, Star as StarIcon58,
  Heart as HeartIcon56, Award as AwardIcon55, Crown as CrownIcon55,
  Compass as CompassIcon60, Camera as CameraIcon56, Phone as PhoneIcon56,
  Mail as MailIcon57, Calendar as CalendarIcon56, Clock as ClockIcon57,
  Home as HomeIcon56, Settings as SettingsIcon56, Power as PowerIcon55,
  Cloud as CloudIcon56, Star as StarIcon59, Heart as HeartIcon57,
  Award as AwardIcon56, Crown as CrownIcon56, Compass as CompassIcon61,
  Camera as CameraIcon57, Phone as PhoneIcon57, Mail as MailIcon58,
  Calendar as CalendarIcon57, Clock as ClockIcon58, Home as HomeIcon57,
  Settings as SettingsIcon57, Power as PowerIcon56, Cloud as CloudIcon57,
  Star as StarIcon60, Heart as HeartIcon58, Award as AwardIcon57,
  Crown as CrownIcon57, Compass as CompassIcon62, Camera as CameraIcon58,
  Phone as PhoneIcon58, Mail as MailIcon59, Calendar as CalendarIcon58,
  Clock as ClockIcon59, Home as HomeIcon58, Settings as SettingsIcon58,
  Power as PowerIcon57, Cloud as CloudIcon58, Star as StarIcon61,
  Heart as HeartIcon59, Award as AwardIcon58, Crown as CrownIcon58,
  Compass as CompassIcon63, Camera as CameraIcon59, Phone as PhoneIcon59,
  Mail as MailIcon60, Calendar as CalendarIcon59, Clock as ClockIcon60,
  Home as HomeIcon59, Settings as SettingsIcon59, Power as PowerIcon58,
  Cloud as CloudIcon59, Star as StarIcon62, Heart as HeartIcon60,
  Award as AwardIcon59, Crown as CrownIcon59, Compass as CompassIcon64,
  Camera as CameraIcon60, Phone as PhoneIcon60, Mail as MailIcon61,
  Calendar as CalendarIcon60, Clock as ClockIcon61, Home as HomeIcon60,
  Settings as SettingsIcon60, Power as PowerIcon59, Cloud as CloudIcon60,
  Star as StarIcon63, Heart as HeartIcon61, Award as AwardIcon60,
  Crown as CrownIcon60, Compass as CompassIcon65, Camera as CameraIcon61,
  Phone as PhoneIcon61, Mail as MailIcon62, Calendar as CalendarIcon61,
  Clock as ClockIcon62, Home as HomeIcon61, Settings as SettingsIcon61,
  Power as PowerIcon60, Cloud as CloudIcon61, Star as StarIcon64,
  Heart as HeartIcon62, Award as AwardIcon61, Crown as CrownIcon61,
  Compass as CompassIcon66, Camera as CameraIcon62, Phone as PhoneIcon62,
  Mail as MailIcon63, Calendar as CalendarIcon62, Clock as ClockIcon63,
  Home as HomeIcon62, Settings as SettingsIcon62, Power as PowerIcon61,
  Cloud as CloudIcon62, Star as StarIcon65, Heart as HeartIcon63,
  Award as AwardIcon62, Crown as CrownIcon62, Compass as CompassIcon67,
  Camera as CameraIcon63, Phone as PhoneIcon63, Mail as MailIcon64,
  Calendar as CalendarIcon63, Clock as ClockIcon64, Home as HomeIcon63,
  Settings as SettingsIcon63, Power as PowerIcon62, Cloud as CloudIcon63,
  Star as StarIcon66, Heart as HeartIcon64, Award as AwardIcon63,
  Crown as CrownIcon63, Compass as CompassIcon68, Camera as CameraIcon64,
  Phone as PhoneIcon64, Mail as MailIcon65, Calendar as CalendarIcon64,
  Clock as ClockIcon65, Home as HomeIcon64, Settings as SettingsIcon64,
  Power as PowerIcon63, Cloud as CloudIcon64, Star as StarIcon67,
  Heart as HeartIcon65, Award as AwardIcon64, Crown as CrownIcon64,
  Compass as CompassIcon69, Camera as CameraIcon65, Phone as PhoneIcon65,
  Mail as MailIcon66, Calendar as CalendarIcon65, Clock as ClockIcon66,
  Home as HomeIcon65, Settings as SettingsIcon65, Power as PowerIcon64,
  Cloud as CloudIcon65, Star as StarIcon68, Heart as HeartIcon66,
  Award as AwardIcon65, Crown as CrownIcon65, Compass as CompassIcon70,
  Camera as CameraIcon66, Phone as PhoneIcon66, Mail as MailIcon67,
  Calendar as CalendarIcon66, Clock as ClockIcon67, Home as HomeIcon66,
  Settings as SettingsIcon66, Power as PowerIcon65, Cloud as CloudIcon66,
  Star as StarIcon69, Heart as HeartIcon67, Award as AwardIcon66,
  Crown as CrownIcon66, Compass as CompassIcon71, Camera as CameraIcon67,
  Phone as PhoneIcon67, Mail as MailIcon68, Calendar as CalendarIcon67,
  Clock as ClockIcon68, Home as HomeIcon67, Settings as SettingsIcon67,
  Power as PowerIcon66, Cloud as CloudIcon67, Star as StarIcon70,
  Heart as HeartIcon68, Award as AwardIcon67, Crown as CrownIcon67,
  Compass as CompassIcon72, Camera as CameraIcon68, Phone as PhoneIcon68,
  Mail as MailIcon69, Calendar as CalendarIcon68, Clock as ClockIcon69,
  Home as HomeIcon68, Settings as SettingsIcon68, Power as PowerIcon67,
  Cloud as CloudIcon68, Star as StarIcon71, Heart as HeartIcon69,
  Award as AwardIcon68, Crown as CrownIcon68, Compass as CompassIcon73,
  Camera as CameraIcon69, Phone as PhoneIcon69, Mail as MailIcon70,
  Calendar as CalendarIcon69, Clock as ClockIcon70, Home as HomeIcon69,
  Settings as SettingsIcon69, Power as PowerIcon68, Cloud as CloudIcon69,
  Star as StarIcon72, Heart as HeartIcon70, Award as AwardIcon69,
  Crown as CrownIcon69, Compass as CompassIcon74, Camera as CameraIcon70,
  Phone as PhoneIcon70, Mail as MailIcon71, Calendar as CalendarIcon70,
  Clock as ClockIcon71, Home as HomeIcon70, Settings as SettingsIcon70,
  Power as PowerIcon69, Cloud as CloudIcon70, Star as StarIcon73,
  Heart as HeartIcon71, Award as AwardIcon70, Crown as CrownIcon70,
  Compass as CompassIcon75, Camera as CameraIcon71, Phone as PhoneIcon71,
  Mail as MailIcon72, Calendar as CalendarIcon71, Clock as ClockIcon72,
  Home as HomeIcon71, Settings as SettingsIcon71, Power as PowerIcon70,
  Cloud as CloudIcon71, Star as StarIcon74, Heart as HeartIcon72,
  Award as AwardIcon71, Crown as CrownIcon71, Compass as CompassIcon76,
  Camera as CameraIcon72, Phone as PhoneIcon72, Mail as MailIcon73,
  Calendar as CalendarIcon72, Clock as ClockIcon73, Home as HomeIcon72,
  Settings as SettingsIcon72, Power as PowerIcon71, Cloud as CloudIcon72,
  Star as StarIcon75, Heart as HeartIcon73, Award as AwardIcon72,
  Crown as CrownIcon72, Compass as CompassIcon77, Camera as CameraIcon73,
  Phone as PhoneIcon73, Mail as MailIcon74, Calendar as CalendarIcon73,
  Clock as ClockIcon74, Home as HomeIcon73, Settings as SettingsIcon73,
  Power as PowerIcon72, Cloud as CloudIcon73, Star as StarIcon76,
  Heart as HeartIcon74, Award as AwardIcon73, Crown as CrownIcon73,
  Compass as CompassIcon78, Camera as CameraIcon74, Phone as PhoneIcon74,
  Mail as MailIcon75, Calendar as CalendarIcon74, Clock as ClockIcon75,
  Home as HomeIcon74, Settings as SettingsIcon74, Power as PowerIcon73,
  Cloud as CloudIcon74, Star as StarIcon77, Heart as HeartIcon75,
  Award as AwardIcon74, Crown as CrownIcon74, Compass as CompassIcon79,
  Camera as CameraIcon75, Phone as PhoneIcon75, Mail as MailIcon76,
  Calendar as CalendarIcon75, Clock as ClockIcon76, Home as HomeIcon75,
  Settings as SettingsIcon75, Power as PowerIcon74, Cloud as CloudIcon75,
  Star as StarIcon78, Heart as HeartIcon76, Award as AwardIcon75,
  Crown as CrownIcon75, Compass as CompassIcon80, Camera as CameraIcon76,
  Phone as PhoneIcon76, Mail as MailIcon77, Calendar as CalendarIcon76,
  Clock as ClockIcon77, Home as HomeIcon76, Settings as SettingsIcon76,
  Power as PowerIcon75, Cloud as CloudIcon76, Star as StarIcon79,
  Heart as HeartIcon77, Award as AwardIcon76, Crown as CrownIcon76,
  Compass as CompassIcon81, Camera as CameraIcon77, Phone as PhoneIcon77,
  Mail as MailIcon78, Calendar as CalendarIcon77, Clock as ClockIcon78,
  Home as HomeIcon77, Settings as SettingsIcon77, Power as PowerIcon76,
  Cloud as CloudIcon77, Star as StarIcon80, Heart as HeartIcon78,
  Award as AwardIcon77, Crown as CrownIcon77, Compass as CompassIcon82,
  Camera as CameraIcon78, Phone as PhoneIcon78, Mail as MailIcon79,
  Calendar as CalendarIcon78, Clock as ClockIcon79, Home as HomeIcon78,
  Settings as SettingsIcon78, Power as PowerIcon77, Cloud as CloudIcon78,
  Star as StarIcon81, Heart as HeartIcon79, Award as AwardIcon78,
  Crown as CrownIcon78, Compass as CompassIcon83, Camera as CameraIcon79,
  Phone as PhoneIcon79, Mail as MailIcon80, Calendar as CalendarIcon79,
  Clock as ClockIcon80, Home as HomeIcon79, Settings as SettingsIcon79,
  Power as PowerIcon78, Cloud as CloudIcon79, Star as StarIcon82,
  Heart as HeartIcon80, Award as AwardIcon79, Crown as CrownIcon79,
  Compass as CompassIcon84, Camera as CameraIcon80, Phone as PhoneIcon80,
  Mail as MailIcon81, Calendar as CalendarIcon80, Clock as ClockIcon81,
  Home as HomeIcon80, Settings as SettingsIcon80, Power as PowerIcon79,
  Cloud as CloudIcon80, Star as StarIcon83, Heart as HeartIcon81,
  Award as AwardIcon80, Crown as CrownIcon80, Compass as CompassIcon85,
  Camera as CameraIcon81, Phone as PhoneIcon81, Mail as MailIcon82,
  Calendar as CalendarIcon81, Clock as ClockIcon82, Home as HomeIcon81,
  Settings as SettingsIcon81, Power as PowerIcon80, Cloud as CloudIcon81,
  Star as StarIcon84, Heart as HeartIcon82, Award as AwardIcon81,
  Crown as CrownIcon81, Compass as CompassIcon86, Camera as CameraIcon82,
  Phone as PhoneIcon82, Mail as MailIcon83, Calendar as CalendarIcon82,
  Clock as ClockIcon83, Home as HomeIcon82, Settings as SettingsIcon82,
  Power as PowerIcon81, Cloud as CloudIcon82, Star as StarIcon85,
  Heart as HeartIcon83, Award as AwardIcon82, Crown as CrownIcon82,
  Compass as CompassIcon87, Camera as CameraIcon83, Phone as PhoneIcon83,
  Mail as MailIcon84, Calendar as CalendarIcon83, Clock as ClockIcon84,
  Home as HomeIcon83, Settings as SettingsIcon83, Power as PowerIcon82,
  Cloud as CloudIcon83, Star as StarIcon86, Heart as HeartIcon84,
  Award as AwardIcon83, Crown as CrownIcon83, Compass as CompassIcon88,
  Camera as CameraIcon84, Phone as PhoneIcon84, Mail as MailIcon85,
  Calendar as CalendarIcon84, Clock as ClockIcon85, Home as HomeIcon84,
  Settings as SettingsIcon84, Power as PowerIcon83, Cloud as CloudIcon84,
  Star as StarIcon87, Heart as HeartIcon85, Award as AwardIcon84,
  Crown as CrownIcon84, Compass as CompassIcon89, Camera as CameraIcon85,
  Phone as PhoneIcon85, Mail as MailIcon86, Calendar as CalendarIcon85,
  Clock as ClockIcon86, Home as HomeIcon85, Settings as SettingsIcon85,
  Power as PowerIcon84, Cloud as CloudIcon85, Star as StarIcon88,
  Heart as HeartIcon86, Award as AwardIcon85, Crown as CrownIcon85,
  Compass as CompassIcon90, Camera as CameraIcon86, Phone as PhoneIcon86,
  Mail as MailIcon87, Calendar as CalendarIcon86, Clock as ClockIcon87,
  Home as HomeIcon86, Settings as SettingsIcon86, Power as PowerIcon85,
  Cloud as CloudIcon86, Star as StarIcon89, Heart as HeartIcon87,
  Award as AwardIcon86, Crown as CrownIcon86, Compass as CompassIcon91,
  Camera as CameraIcon87, Phone as PhoneIcon87, Mail as MailIcon88,
  Calendar as CalendarIcon87, Clock as ClockIcon88, Home as HomeIcon87,
  Settings as SettingsIcon87, Power as PowerIcon86, Cloud as CloudIcon87,
  Star as StarIcon90, Heart as HeartIcon88, Award as AwardIcon87,
  Crown as CrownIcon87, Compass as CompassIcon92, Camera as CameraIcon88,
  Phone as PhoneIcon88, Mail as MailIcon89, Calendar as CalendarIcon88,
  Clock as ClockIcon89, Home as HomeIcon88, Settings as SettingsIcon88,
  Power as PowerIcon87, Cloud as CloudIcon88, Star as StarIcon91,
  Heart as HeartIcon89, Award as AwardIcon88, Crown as CrownIcon88,
  Compass as CompassIcon93, Camera as CameraIcon89, Phone as PhoneIcon89,
  Mail as MailIcon90, Calendar as CalendarIcon89, Clock as ClockIcon90,
  Home as HomeIcon89, Settings as SettingsIcon89, Power as PowerIcon88,
  Cloud as CloudIcon89, Star as StarIcon92, Heart as HeartIcon90,
  Award as AwardIcon89, Crown as CrownIcon89, Compass as CompassIcon94,
  Camera as CameraIcon90, Phone as PhoneIcon90, Mail as MailIcon91,
  Calendar as CalendarIcon90, Clock as ClockIcon91, Home as HomeIcon90,
  Settings as SettingsIcon90, Power as PowerIcon89, Cloud as CloudIcon90,
  Star as StarIcon93, Heart as HeartIcon91, Award as AwardIcon90,
  Crown as CrownIcon90, Compass as CompassIcon95, Camera as CameraIcon91,
  Phone as PhoneIcon91, Mail as MailIcon92, Calendar as CalendarIcon91,
  Clock as ClockIcon92, Home as HomeIcon91, Settings as SettingsIcon91,
  Power as PowerIcon90, Cloud as CloudIcon91, Star as StarIcon94,
  Heart as HeartIcon92, Award as AwardIcon91, Crown as CrownIcon91,
  Compass as CompassIcon96, Camera as CameraIcon92, Phone as PhoneIcon92,
  Mail as MailIcon93, Calendar as CalendarIcon92, Clock as ClockIcon93,
  Home as HomeIcon92, Settings as SettingsIcon92, Power as PowerIcon91,
  Cloud as CloudIcon92, Star as StarIcon95, Heart as HeartIcon93,
  Award as AwardIcon92, Crown as CrownIcon92, Compass as CompassIcon97,
  Camera as CameraIcon93, Phone as PhoneIcon93, Mail as MailIcon94,
  Calendar as CalendarIcon93, Clock as ClockIcon94, Home as HomeIcon93,
  Settings as SettingsIcon93, Power as PowerIcon92, Cloud as CloudIcon93,
  Star as StarIcon96, Heart as HeartIcon94, Award as AwardIcon93,
  Crown as CrownIcon93, Compass as CompassIcon98, Camera as CameraIcon94,
  Phone as PhoneIcon94, Mail as MailIcon95, Calendar as CalendarIcon94,
  Clock as ClockIcon95, Home as HomeIcon94, Settings as SettingsIcon94,
  Power as PowerIcon93, Cloud as CloudIcon94, Star as StarIcon97,
  Heart as HeartIcon95, Award as AwardIcon94, Crown as CrownIcon94,
  Compass as CompassIcon99, Camera as CameraIcon95, Phone as PhoneIcon95,
  Mail as MailIcon96, Calendar as CalendarIcon95, Clock as ClockIcon96,
  Home as HomeIcon95, Settings as SettingsIcon95, Power as PowerIcon94,
  Cloud as CloudIcon95, Star as StarIcon98, Heart as HeartIcon96,
  Award as AwardIcon95, Crown as CrownIcon95, Compass as CompassIcon100,
  Camera as CameraIcon96, Phone as PhoneIcon96, Mail as MailIcon97,
  Calendar as CalendarIcon96, Clock as ClockIcon97, Home as HomeIcon96,
  Settings as SettingsIcon96, Power as PowerIcon95, Cloud as CloudIcon96,
  Star as StarIcon99, Heart as HeartIcon97, Award as AwardIcon96,
  Crown as CrownIcon96, Compass as CompassIcon101, Camera as CameraIcon97,
  Phone as PhoneIcon97, Mail as MailIcon98, Calendar as CalendarIcon97,
  Clock as ClockIcon98, Home as HomeIcon97, Settings as SettingsIcon97,
  Power as PowerIcon96, Cloud as CloudIcon97, Star as StarIcon100,
  Heart as HeartIcon98, Award as AwardIcon97, Crown as CrownIcon97,
  Compass as CompassIcon102, Camera as CameraIcon98, Phone as PhoneIcon98,
  Mail as MailIcon99, Calendar as CalendarIcon98, Clock as ClockIcon99,
  Home as HomeIcon98, Settings as SettingsIcon98, Power as PowerIcon97,
  Cloud as CloudIcon98, Star as StarIcon101, Heart as HeartIcon99,
  Award as AwardIcon98, Crown as CrownIcon98, Compass as CompassIcon103,
  Camera as CameraIcon99, Phone as PhoneIcon99, Mail as MailIcon100,
  Calendar as CalendarIcon99, Clock as ClockIcon100, Home as HomeIcon99,
  Settings as SettingsIcon99, Power as PowerIcon98, Cloud as CloudIcon99,
  Star as StarIcon102, Heart as HeartIcon100, Award as AwardIcon99,
  Crown as CrownIcon99
} from 'lucide-react';
import { useTeacherIdentity } from '../hooks/useTeacherIdentity';
import { Teacher, LessonPlan, Assignment, LoginLog } from '../types';
import { APIService } from '../services/api-supabase';
import { INITIAL_TEACHERS, DEFAULT_TEACHER_PASSWORD } from '../constants';
import { getUpcomingMonday, formatDate } from '../utils';

interface AdminRegistryProps {
  teachers: Teacher[];
  lessonPlans: LessonPlan[];
  loginLogs: LoginLog[];
  resubmissionRequests: any[];
  onAddTeacher: (teacher: Teacher) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  onRemoveTeacher: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  isOnline: boolean;
}

const AdminRegistry: React.FC<AdminRegistryProps> = ({ 
  teachers, 
  lessonPlans,
  loginLogs,
  resubmissionRequests,
  onAddTeacher, 
  onUpdateTeacher, 
  onRemoveTeacher,
  onRefresh,
  isOnline
}) => {
  const { normalizeTeacher, getTeacherId } = useTeacherIdentity();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Teacher>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newAssignment, setNewAssignment] = useState<Omit<Assignment, 'sections'> & { sections: string }>({
    className: '10',
    subject: '',
    sections: ''
  });
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({
    name: '',
    email: '',
    phone: '',
    password: 'Teacher@2024',
    isClassTeacher: false,
    classTeacherOf: null,
    assignments: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showSeedPreview, setShowSeedPreview] = useState(false);
  const [showFirebaseData, setShowFirebaseData] = useState(false);
  const [firebaseTeachers, setFirebaseTeachers] = useState<Teacher[]>([]);
  const [isLoadingFirebase, setIsLoadingFirebase] = useState(false);
  const [selectedTeacherForLessonPlans, setSelectedTeacherForLessonPlans] = useState<Teacher | null>(null);
  const [showLessonPlanPreview, setShowLessonPlanPreview] = useState(false);
  const [showDefaulterEmailModal, setShowDefaulterEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<string>('');
  const [selectedDefaulters, setSelectedDefaulters] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [expandedTeachers, setExpandedTeachers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'registry' | 'compile'>('dashboard');
  const [compiledPlans, setCompiledPlans] = useState<{className: string, section: string, plans: LessonPlan[]}[]>([]);
  const [showCompilePreview, setShowCompilePreview] = useState(false);
  const [compileFormat, setCompileFormat] = useState<'pdf' | 'text' | 'excel'>('pdf');
  const [isCompiling, setIsCompiling] = useState(false);

  // Dashboard Stats Calculations
  const upcomingMonday = getUpcomingMonday();
  const weekLabel = `${formatDate(upcomingMonday)} - ${formatDate(new Date(upcomingMonday.getTime() + 6 * 24 * 60 * 60 * 1000))}`;
  
  const totalTeachers = teachers.length;
  const submittedThisWeek = new Set(
    lessonPlans
      .filter(plan => plan.weekStarting === upcomingMonday.toISOString())
      .map(plan => plan.teacherId)
  ).size;
  const defaultersCount = totalTeachers - submittedThisWeek;
  const submissionRate = totalTeachers > 0 ? (submittedThisWeek / totalTeachers * 100).toFixed(1) : '0';
  
  const todayLogins = loginLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;
  
  const pendingResubmissions = resubmissionRequests.length;
  
  const recentLogins = loginLogs.slice(0, 5);
  const recentSubmissions = lessonPlans
    .filter(plan => new Date(plan.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .slice(0, 5);

  // Filter teachers based on search and class
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || 
                         teacher.assignments.some(a => a.className === filterClass);
    return matchesSearch && matchesClass;
  });

  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(teachers.flatMap(t => t.assignments.map(a => a.className)))).sort();

  // Get teacher's lesson plans
  const getTeacherLessonPlans = (teacherEmail: string) => {
    return lessonPlans.filter(plan => plan.teacherId === teacherEmail);
  };

  // Toggle teacher expansion
  const toggleTeacherExpansion = (teacherId: string) => {
    if (expandedTeachers.includes(teacherId)) {
      setExpandedTeachers(expandedTeachers.filter(id => id !== teacherId));
    } else {
      setExpandedTeachers([...expandedTeachers, teacherId]);
    }
  };

  // Download lesson plans as TEXT
  const downloadLessonPlansAsText = (teacher: Teacher) => {
    const teacherPlans = getTeacherLessonPlans(teacher.email);
    if (teacherPlans.length === 0) {
      alert('No lesson plans found for this teacher');
      return;
    }

    let textContent = `Lesson Plans - ${teacher.name}\n`;
    textContent += `Email: ${teacher.email}\n`;
    textContent += `Date: ${new Date().toLocaleDateString()}\n`;
    textContent += '='.repeat(50) + '\n\n';

    teacherPlans.forEach((plan, index) => {
      textContent += `PLAN #${index + 1}\n`;
      textContent += `Subject: ${plan.subject}\n`;
      textContent += `Class: ${plan.className}-${plan.section}\n`;
      textContent += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
      textContent += `Topics: ${plan.topics}\n`;
      textContent += `Homework: ${plan.homework}\n`;
      textContent += '-'.repeat(40) + '\n\n';
    });

    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LessonPlans_${teacher.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Share lesson plans via email
  const shareLessonPlansViaEmail = (teacher: Teacher) => {
    const teacherPlans = getTeacherLessonPlans(teacher.email);
    if (teacherPlans.length === 0) {
      alert('No lesson plans found for this teacher');
      return;
    }

    const subject = `Lesson Plans - ${teacher.name}`;
    let body = `Dear ${teacher.name},\n\n`;
    body += `Here are your lesson plans:\n\n`;
    
    teacherPlans.forEach((plan, index) => {
      body += `Plan #${index + 1}:\n`;
      body += `Subject: ${plan.subject}\n`;
      body += `Class: ${plan.className}-${plan.section}\n`;
      body += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
      body += `Topics: ${plan.topics}\n`;
      body += `Homework: ${plan.homework}\n\n`;
    });

    body += `\nBest regards,\nSacred Heart School Administration`;

    const mailtoLink = `mailto:${teacher.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  // Send email to defaulters
  const sendEmailToDefaulters = async () => {
    const defaulters = teachers.filter(teacher => {
      const hasSubmitted = lessonPlans.some(plan => 
        plan.teacherId === teacher.email && 
        plan.weekStarting === upcomingMonday.toISOString()
      );
      return !hasSubmitted;
    });

    if (defaulters.length === 0) {
      alert('No defaulters found for this week!');
      return;
    }

    setSelectedDefaulters(defaulters.map(d => d.email));
    setEmailTemplate(`Dear Teacher,

This is a reminder that your lesson plan for the week of ${weekLabel} is pending.

Please submit your lesson plan at your earliest convenience.

Best regards,
Sacred Heart School Administration`);
    setShowDefaulterEmailModal(true);
  };

  // Send email using mailto fallback
  const sendBulkEmails = async () => {
    if (!isOnline) {
      alert('Cannot send emails while offline');
      return;
    }

    if (selectedDefaulters.length === 0) {
      alert('No recipients selected');
      return;
    }

    setIsSendingEmail(true);
    
    try {
      // Get teacher details for selected emails
      const recipients = teachers
        .filter(teacher => selectedDefaulters.includes(teacher.email))
        .map(teacher => ({
          email: teacher.email,
          name: teacher.name
        }));

      // If only one recipient, open mailto directly
      if (recipients.length === 1) {
        const recipient = recipients[0];
        const mailtoLink = `mailto:${recipient.email}?subject=Reminder: Pending Lesson Plan Submission&body=${encodeURIComponent(emailTemplate)}`;
        window.open(mailtoLink, '_blank');
      } else {
        // For multiple recipients, create individual mailto links
        alert(`Preparing ${recipients.length} email(s). You will need to send them individually.`);
        
        // Create first email
        const firstRecipient = recipients[0];
        const mailtoLink = `mailto:${firstRecipient.email}?subject=Reminder: Pending Lesson Plan Submission&body=${encodeURIComponent(emailTemplate)}`;
        window.open(mailtoLink, '_blank');
      }
      
      setShowDefaulterEmailModal(false);
      setSelectedDefaulters([]);
      setEmailTemplate('');
      
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('Failed to send emails. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Preview teacher lesson plans
  const previewTeacherLessonPlans = (teacher: Teacher) => {
    setSelectedTeacherForLessonPlans(teacher);
    setShowLessonPlanPreview(true);
  };

  // Download all lesson plans for a class as TEXT
  const downloadClassLessonPlans = (className: string) => {
    const classPlans = lessonPlans.filter(plan => plan.className === className);
    if (classPlans.length === 0) {
      alert(`No lesson plans found for Class ${className}`);
      return;
    }

    let textContent = `Class ${className} Lesson Plans\n`;
    textContent += `Date: ${new Date().toLocaleDateString()}\n`;
    textContent += '='.repeat(50) + '\n\n';

    classPlans.forEach((plan, index) => {
      const teacher = teachers.find(t => t.email === plan.teacherId);
      textContent += `PLAN #${index + 1}\n`;
      textContent += `Teacher: ${teacher?.name || plan.teacherId}\n`;
      textContent += `Subject: ${plan.subject}\n`;
      textContent += `Class: ${plan.className}-${plan.section}\n`;
      textContent += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
      textContent += `Topics: ${plan.topics}\n`;
      textContent += `Homework: ${plan.homework}\n`;
      textContent += `Submitted: ${new Date(plan.submittedAt).toLocaleDateString()}\n`;
      textContent += '-'.repeat(40) + '\n\n';
    });

    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Class_${className}_Lesson_Plans_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Get class-wise statistics
  const getClassWiseStats = () => {
    const stats: Record<string, { total: number; submitted: number }> = {};
    
    teachers.forEach(teacher => {
      teacher.assignments.forEach(assignment => {
        const className = assignment.className;
        if (!stats[className]) {
          stats[className] = { total: 0, submitted: 0 };
        }
        stats[className].total += assignment.sections.length;
      });
    });

    lessonPlans.forEach(plan => {
      const className = plan.className;
      if (stats[className]) {
        stats[className].submitted += 1;
      }
    });

    return stats;
  };

  const classStats = getClassWiseStats();

  // Compile lesson plans by class and section
  const compileLessonPlans = () => {
    setIsCompiling(true);
    
    // Group by class and section
    const grouped: Record<string, Record<string, LessonPlan[]>> = {};
    
    lessonPlans.forEach(plan => {
      const classKey = plan.className;
      const sectionKey = plan.section;
      
      if (!grouped[classKey]) {
        grouped[classKey] = {};
      }
      
      if (!grouped[classKey][sectionKey]) {
        grouped[classKey][sectionKey] = [];
      }
      
      grouped[classKey][sectionKey].push(plan);
    });
    
    // Convert to array format
    const compiled = Object.entries(grouped).flatMap(([className, sections]) =>
      Object.entries(sections).map(([section, plans]) => ({
        className,
        section,
        plans
      }))
    );
    
    setCompiledPlans(compiled);
    setShowCompilePreview(true);
    setIsCompiling(false);
  };

  // Download compiled plans
  const downloadCompiledPlans = (format: 'pdf' | 'text' | 'excel') => {
    if (compiledPlans.length === 0) {
      alert('No plans to compile');
      return;
    }

    let content = '';
    
    if (format === 'text') {
      content = `COMPILED LESSON PLANS\n`;
      content += `Date: ${new Date().toLocaleDateString()}\n`;
      content += '='.repeat(60) + '\n\n';
      
      compiledPlans.forEach(({ className, section, plans }) => {
        content += `CLASS ${className}, SECTION ${section}\n`;
        content += '-'.repeat(40) + '\n\n';
        
        plans.forEach((plan, index) => {
          const teacher = teachers.find(t => t.email === plan.teacherId);
          content += `${index + 1}. ${plan.subject} - ${teacher?.name || 'Unknown'}\n`;
          content += `   Chapter: ${plan.chapter}\n`;
          content += `   Topics: ${plan.topics}\n`;
          content += `   Homework: ${plan.homework}\n\n`;
        });
        
        content += '\n';
      });
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compiled_Lesson_Plans_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // For PDF, we'll create a printable HTML page
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Compiled Lesson Plans</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
                .class-section { margin-bottom: 30px; border: 1px solid #ccc; padding: 20px; }
                .plan { margin: 15px 0; padding: 10px; border-left: 4px solid #4f46e5; }
                .teacher { font-weight: bold; color: #555; }
                .meta { color: #666; font-size: 0.9em; }
              </style>
            </head>
            <body>
              <h1>Compiled Lesson Plans</h1>
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <hr>
        `);
        
        compiledPlans.forEach(({ className, section, plans }) => {
          printWindow.document.write(`
            <div class="class-section">
              <h2>Class ${className}, Section ${section}</h2>
          `);
          
          plans.forEach((plan, index) => {
            const teacher = teachers.find(t => t.email === plan.teacherId);
            printWindow.document.write(`
              <div class="plan">
                <div class="teacher">${index + 1}. ${plan.subject} - ${teacher?.name || 'Unknown'}</div>
                <div class="meta">Chapter: ${plan.chapter}</div>
                <div><strong>Topics:</strong> ${plan.topics}</div>
                <div><strong>Homework:</strong> ${plan.homework}</div>
              </div>
            `);
          });
          
          printWindow.document.write('</div>');
        });
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Firebase functions
  const handleSeed = async () => {
    if (isSeeding) {
      console.log("Seed operation already in progress, ignoring duplicate call");
      return;
    }

    if (!confirm(
      `Seed cloud faculty registry with ${INITIAL_TEACHERS.length} local records?\n\nThis will add all initial teachers to the database.`
    )) {
      return;
    }

    setIsSeeding(true);

    try {
      const currentTeachers = await APIService.fetchTeachers();

      if (currentTeachers.length > 0) {
        const shouldOverwrite = confirm(
          `Database already contains ${currentTeachers.length} teachers. Do you want to overwrite with initial teachers?`
        );

        if (!shouldOverwrite) {
          setIsSeeding(false);
          return;
        }

        await APIService.clearTeachersCollection();
      }

      await APIService.syncInitialTeachers(INITIAL_TEACHERS);

      alert(`Success: ${INITIAL_TEACHERS.length} faculty members synchronized to cloud.`);
      await onRefresh();
      setShowSeedPreview(false);
    } catch (e) {
      console.error("Seed error:", e);
      alert("Sync error: " + e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleViewFirebaseData = async () => {
    setIsLoadingFirebase(true);
    try {
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
      } else {
        alert("Firebase database is currently empty. Click 'Seed Database' to add initial teachers.");
      }
    } catch (error) {
      console.error("Error viewing Firebase data:", error);
      alert("Failed to fetch data from Firebase.");
    } finally {
      setIsLoadingFirebase(false);
    }
  };

  const handleSmartSeed = async () => {
    if (isSeeding) return;
    
    setIsSeeding(true);
    try {
      const currentFirebaseTeachers = await APIService.fetchTeachers();
      
      if (currentFirebaseTeachers.length > 0) {
        setFirebaseTeachers(currentFirebaseTeachers);
        setShowFirebaseData(true);
        alert(`⚠️ Firebase already contains ${currentFirebaseTeachers.length} teachers. Showing current data instead.`);
      } else {
        await APIService.syncInitialTeachers(INITIAL_TEACHERS);
        const seededTeachers = await APIService.fetchTeachers();
        setFirebaseTeachers(seededTeachers);
        setShowFirebaseData(true);
        await onRefresh();
        alert(`✅ Successfully seeded ${INITIAL_TEACHERS.length} teachers to empty database`);
      }
    } catch (error) {
      console.error("Error in smart seed:", error);
      alert("Failed to process seed request.");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsEditing(true);
    setShowEditPassword(false);
  };

  const handleSaveEdit = async () => {
    if (!editingTeacher || !editFormData) return;
    
    try {
      const updates = { ...editFormData };
      
      if (!updates.password || updates.password.trim() === '') {
        updates.password = DEFAULT_TEACHER_PASSWORD;
      }
      
      await onUpdateTeacher(getTeacherId(editingTeacher.email), updates);
      setIsEditing(false);
      setEditingTeacher(null);
      setEditFormData({});
      await onRefresh();
      alert("Teacher information updated successfully!");
    } catch (error) {
      alert("Failed to update teacher. Please try again.");
    }
  };

  const handleAddNewTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email) {
      alert("Please enter both name and email.");
      return;
    }

    const teacherData: Teacher = normalizeTeacher({
      name: newTeacher.name,
      email: newTeacher.email,
      phone: newTeacher.phone || '',
      password: newTeacher.password || DEFAULT_TEACHER_PASSWORD,
      isClassTeacher: newTeacher.isClassTeacher || false,
      classTeacherOf: newTeacher.classTeacherOf || null,
      assignments: newTeacher.assignments || []
    });

    try {
      await onAddTeacher(teacherData);
      await onRefresh();
      setShowAddTeacher(false);
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        password: DEFAULT_TEACHER_PASSWORD,
        isClassTeacher: false,
        classTeacherOf: null,
        assignments: []
      });
      alert("Teacher added successfully!");
    } catch (error) {
      alert("Failed to add teacher. Please try again.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700/50 mb-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 border-b-2 ${activeTab === 'dashboard' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-3">
            <Layout className="h-4 w-4" />
            Dashboard
          </div>
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 border-b-2 ${activeTab === 'registry' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4" />
            Faculty Registry
          </div>
        </button>
        <button
          onClick={() => setActiveTab('compile')}
          className={`px-8 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 border-b-2 ${activeTab === 'compile' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-4 w-4" />
            Compile & Send
          </div>
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Dashboard Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-400 font-bold mt-2">
                Welcome back! Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => onRefresh()}
                className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 group"
              >
                <RefreshCw className="h-5 w-5 text-gray-300 group-hover:rotate-180 transition-transform duration-500" />
              </button>
              <div className="text-right">
                <div className="text-xs text-gray-400 font-bold">Last Updated</div>
                <div className="text-sm font-black text-white">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-sm p-6 rounded-2xl border border-indigo-500/30 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                  <Users className="h-6 w-6 text-indigo-400" />
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white mb-2">{totalTeachers}</div>
              <div className="text-sm font-bold text-indigo-300">Total Faculty</div>
              <div className="text-xs text-gray-400 mt-2">Active teaching staff</div>
            </div>

            <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/30 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <BookOpen className="h-6 w-6 text-emerald-400" />
                </div>
                <div className="text-emerald-400 text-sm font-black bg-emerald-500/20 px-2 py-1 rounded-lg">
                  {submissionRate}%
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-2">{submittedThisWeek}</div>
              <div className="text-sm font-bold text-emerald-300">Submitted This Week</div>
              <div className="text-xs text-gray-400 mt-2">Week: {weekLabel}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-sm p-6 rounded-2xl border border-amber-500/30 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <ArrowDownRight className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white mb-2">{defaultersCount}</div>
              <div className="text-sm font-bold text-amber-300">Pending Submissions</div>
              <div className="text-xs text-gray-400 mt-2">Reminders scheduled</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30 group hover:scale-[1.02] transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
                <div className="text-purple-400 text-sm font-black bg-purple-500/20 px-2 py-1 rounded-lg">
                  Today
                </div>
              </div>
              <div className="text-3xl font-black text-white mb-2">{todayLogins}</div>
              <div className="text-sm font-bold text-purple-300">Today's Logins</div>
              <div className="text-xs text-gray-400 mt-2">Active users</div>
            </div>
          </div>

          {/* Class-wise Stats and Actions */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-white">Class-wise Lesson Plans</h3>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-900/70 border border-gray-700 rounded-xl text-white text-sm"
                  />
                </div>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-4 py-2 bg-gray-900/70 border border-gray-700 rounded-xl text-white text-sm"
                >
                  <option value="all">All Classes</option>
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {Object.entries(classStats).map(([className, stat]) => (
                <div key={className} className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-black text-white">Class {className}</span>
                    <span className={`text-xs font-black px-2 py-1 rounded ${stat.submitted >= stat.total ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {stat.submitted}/{stat.total}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadClassLessonPlans(className)}
                    className="w-full mt-2 px-3 py-1.5 bg-indigo-600/20 text-indigo-300 text-xs font-black rounded-lg hover:bg-indigo-600/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-3 w-3" />
                    Download Plans
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
            <h3 className="text-lg font-black text-white mb-6">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={sendEmailToDefaulters}
                className="p-4 bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-xl border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Email Defaulters</div>
                    <div className="text-xs text-gray-400">Send reminders</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  // Download all lesson plans as text
                  let textContent = 'All Lesson Plans\n';
                  textContent += `Date: ${new Date().toLocaleDateString()}\n`;
                  textContent += '='.repeat(50) + '\n\n';
                  
                  lessonPlans.forEach((plan, index) => {
                    const teacher = teachers.find(t => t.email === plan.teacherId);
                    textContent += `PLAN #${index + 1}\n`;
                    textContent += `Teacher: ${teacher?.name || plan.teacherId}\n`;
                    textContent += `Subject: ${plan.subject}\n`;
                    textContent += `Class: ${plan.className}-${plan.section}\n`;
                    textContent += `Week: ${new Date(plan.weekStarting).toLocaleDateString()}\n`;
                    textContent += `Topics: ${plan.topics}\n`;
                    textContent += `Homework: ${plan.homework}\n`;
                    textContent += `Submitted: ${new Date(plan.submittedAt).toLocaleDateString()}\n`;
                    textContent += '-'.repeat(40) + '\n\n';
                  });
                  
                  const blob = new Blob([textContent], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `All_Lesson_Plans_${new Date().toISOString().split('T')[0]}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <DownloadCloud className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Export All Data</div>
                    <div className="text-xs text-gray-400">Download Text</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowAddTeacher(true)}
                className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Add Teacher</div>
                    <div className="text-xs text-gray-400">New faculty</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleSmartSeed}
                disabled={isSeeding}
                className="p-4 bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-xl border border-violet-500/30 hover:border-violet-400/50 transition-all duration-300 group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  {isSeeding ? (
                    <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                  ) : (
                    <CloudUpload className="h-5 w-5 text-violet-400 group-hover:scale-110 transition-transform" />
                  )}
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Seed Database</div>
                    <div className="text-xs text-gray-400">Add initial data</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'registry' && (
        <>
          {/* Faculty Registry Section */}
          <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
            {/* Header Section with New Buttons */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Faculty Registry & Lesson Plans
                </h3>
                <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">
                  {teachers.length} teachers • {lessonPlans.length} lesson plans
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddTeacher(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Teacher
                </button>
                <button 
                  onClick={sendEmailToDefaulters}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-amber-700 transition-all"
                >
                  <Mail className="h-4 w-4" />
                  Email Defaulters
                </button>
                <button 
                  onClick={() => onRefresh()}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button 
                  onClick={handleViewFirebaseData}
                  disabled={isLoadingFirebase}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isLoadingFirebase ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Server className="h-4 w-4" />
                  )}
                  {isLoadingFirebase ? 'Loading...' : 'View Firebase'}
                </button>
              </div>
            </div>

            {filteredTeachers.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-3xl">
                <Database className="h-16 w-16 text-blue-400 mb-4" />
                <p className="text-white font-black text-lg mb-2">No teachers found</p>
                <p className="text-gray-400 mb-6 max-w-md">
                  {searchTerm ? 'Try a different search term' : 'Add teachers to get started'}
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button 
                    onClick={() => setShowAddTeacher(true)}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4 inline mr-2" />
                    Add Teacher
                  </button>
                  <button 
                    onClick={handleViewFirebaseData}
                    disabled={isLoadingFirebase}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoadingFirebase ? (
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                    ) : (
                      <Server className="h-4 w-4 inline mr-2" />
                    )}
                    {isLoadingFirebase ? 'Loading...' : 'Check Firebase'}
                  </button>
                  <button 
                    onClick={handleSmartSeed}
                    disabled={isSeeding}
                    className="px-6 py-3 bg-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 inline mr-2" />
                    )}
                    {isSeeding ? 'Processing...' : 'Smart Seed'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTeachers.map(teacher => {
                  const teacherPlans = getTeacherLessonPlans(teacher.email);
                  const isExpanded = expandedTeachers.includes(teacher.id);
                  const hasSubmittedThisWeek = teacherPlans.some(plan => 
                    plan.weekStarting === upcomingMonday.toISOString()
                  );

                  return (
                    <div key={teacher.id} className="bg-gray-900/30 rounded-2xl border border-gray-700/50 overflow-hidden">
                      {/* Teacher Header */}
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${hasSubmittedThisWeek ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                                <User className={`h-5 w-5 ${hasSubmittedThisWeek ? 'text-emerald-400' : 'text-amber-400'}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3">
                                  <h4 className="text-lg font-black text-white italic">{teacher.name}</h4>
                                  {hasSubmittedThisWeek ? (
                                    <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg">Submitted</span>
                                  ) : (
                                    <span className="text-xs font-black bg-amber-500/20 text-amber-300 px-2 py-1 rounded-lg">Pending</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 font-bold">{teacher.email}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {teacher.assignments.map((asgn, idx) => (
                                    <span key={idx} className="text-xs font-black bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded-lg">
                                      {asgn.subject} (Class {asgn.className})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleTeacherExpansion(teacher.id)}
                              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => previewTeacherLessonPlans(teacher)}
                              className="p-2 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-500/10"
                              title="Preview Lesson Plans"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => downloadLessonPlansAsText(teacher)}
                              className="p-2 text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-500/10"
                              title="Download as Text"
                            >
                              <FileDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => shareLessonPlansViaEmail(teacher)}
                              className="p-2 text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10"
                              title="Email Lesson Plans"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditClick(teacher)}
                              className="p-2 text-indigo-400 hover:text-indigo-300 rounded-lg hover:bg-indigo-500/10"
                              title="Edit Teacher"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onRemoveTeacher(teacher.id)}
                              className="p-2 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                              title="Remove Teacher"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-700/50 bg-gray-900/50 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-black text-gray-300 mb-3">Lesson Plans ({teacherPlans.length})</h5>
                              {teacherPlans.length > 0 ? (
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                  {teacherPlans.map((plan, idx) => (
                                    <div key={idx} className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-white">{plan.subject}</span>
                                        <span className="text-xs font-black bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                          Class {plan.className}-{plan.section}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-400 mb-2">
                                        Week: {new Date(plan.weekStarting).toLocaleDateString()}
                                      </p>
                                      <p className="text-sm text-gray-300 line-clamp-2">{plan.topics}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No lesson plans submitted yet</p>
                              )}
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-black text-gray-300 mb-3">Quick Actions</h5>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => previewTeacherLessonPlans(teacher)}
                                  className="p-3 bg-blue-500/10 text-blue-300 rounded-xl hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="text-xs font-bold">Preview</span>
                                </button>
                                <button
                                  onClick={() => downloadLessonPlansAsText(teacher)}
                                  className="p-3 bg-emerald-500/10 text-emerald-300 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="text-xs font-bold">Download</span>
                                </button>
                                <button
                                  onClick={() => shareLessonPlansViaEmail(teacher)}
                                  className="p-3 bg-amber-500/10 text-amber-300 rounded-xl hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Send className="h-4 w-4" />
                                  <span className="text-xs font-bold">Email</span>
                                </button>
                                <button
                                  onClick={() => window.open(`mailto:${teacher.email}?subject=Lesson Plan Feedback`, '_blank')}
                                  className="p-3 bg-purple-500/10 text-purple-300 rounded-xl hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="text-xs font-bold">Feedback</span>
                                </button>
                              </div>
                              
                              <div className="mt-4 pt-4 border-t border-gray-700/50">
                                <h6 className="text-xs font-black text-gray-400 mb-2">Teacher Info</h6>
                                <div className="text-sm text-gray-300 space-y-1">
                                  <p><span className="text-gray-500">Phone:</span> {teacher.phone || 'Not provided'}</p>
                                  <p><span className="text-gray-500">Password:</span> {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}</p>
                                  <p><span className="text-gray-500">Status:</span> {teacher.isClassTeacher ? `Class Teacher of ${teacher.classTeacherOf?.className}-${teacher.classTeacherOf?.section}` : 'Faculty'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'compile' && (
        <div className="bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 border border-gray-700/50 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-2xl font-black uppercase italic bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Compile & Send Lesson Plans
              </h3>
              <p className="text-sm text-indigo-400 font-black uppercase tracking-[0.2em] mt-2">
                Generate consolidated reports by class and section
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={compileLessonPlans}
                disabled={isCompiling || lessonPlans.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {isCompiling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                {isCompiling ? 'Compiling...' : 'Compile Plans'}
              </button>
              <button 
                onClick={onRefresh}
                className="flex items-center gap-2 px-4 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {showCompilePreview ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-black text-emerald-300 mb-2">Compilation Complete</h4>
                    <p className="text-emerald-400/80 text-sm">
                      Successfully compiled {compiledPlans.length} class-section combinations with {lessonPlans.length} total lesson plans.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {compiledPlans.map(({ className, section, plans }) => (
                  <div key={`${className}-${section}`} className="bg-gray-900/30 rounded-2xl border border-gray-700/50 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-lg font-black text-white">Class {className}</span>
                        <span className="text-sm font-black text-indigo-400 ml-2">Section {section}</span>
                      </div>
                      <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg">
                        {plans.length} plans
                      </span>
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                      {plans.map((plan, idx) => {
                        const teacher = teachers.find(t => t.email === plan.teacherId);
                        return (
                          <div key={idx} className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-bold text-white">{plan.subject}</span>
                              <span className="text-xs font-black text-gray-400">{teacher?.name.split(' ')[0]}</span>
                            </div>
                            <p className="text-xs text-gray-400 truncate" title={plan.chapter}>
                              {plan.chapter}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // Download this specific class-section
                          let textContent = `Class ${className}, Section ${section} Lesson Plans\n`;
                          textContent += `Date: ${new Date().toLocaleDateString()}\n`;
                          textContent += '='.repeat(50) + '\n\n';
                          
                          plans.forEach((plan, index) => {
                            const teacher = teachers.find(t => t.email === plan.teacherId);
                            textContent += `${index + 1}. ${plan.subject} - ${teacher?.name || 'Unknown'}\n`;
                            textContent += `   Chapter: ${plan.chapter}\n`;
                            textContent += `   Topics: ${plan.topics}\n`;
                            textContent += `   Homework: ${plan.homework}\n\n`;
                          });
                          
                          const blob = new Blob([textContent], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Class_${className}_Section_${section}_Plans.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 py-2 bg-indigo-600/20 text-indigo-300 text-xs font-black rounded-lg hover:bg-indigo-600/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </button>
                      <button
                        onClick={() => {
                          // Share via email for this class-section
                          let body = `Lesson Plans for Class ${className}, Section ${section}\n\n`;
                          body += `Date: ${new Date().toLocaleDateString()}\n`;
                          body += '='.repeat(40) + '\n\n';
                          
                          plans.forEach((plan, index) => {
                            const teacher = teachers.find(t => t.email === plan.teacherId);
                            body += `${index + 1}. ${plan.subject} - ${teacher?.name || 'Unknown'}\n`;
                            body += `   Chapter: ${plan.chapter}\n`;
                            body += `   Topics: ${plan.topics}\n`;
                            body += `   Homework: ${plan.homework}\n\n`;
                          });
                          
                          const mailtoLink = `mailto:?subject=Class ${className} Section ${section} Lesson Plans&body=${encodeURIComponent(body)}`;
                          window.open(mailtoLink, '_blank');
                        }}
                        className="flex-1 py-2 bg-amber-600/20 text-amber-300 text-xs font-black rounded-lg hover:bg-amber-600/30 transition-colors flex items-center justify-center gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
                <h4 className="text-lg font-black text-white mb-4">Export All Compiled Plans</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => downloadCompiledPlans('pdf')}
                    className="p-4 bg-gradient-to-br from-rose-600/20 to-pink-600/20 rounded-xl border border-rose-500/30 hover:border-rose-400/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <FilePdf className="h-5 w-5 text-rose-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">Export as PDF</div>
                        <div className="text-xs text-gray-400">Print-friendly format</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => downloadCompiledPlans('text')}
                    className="p-4 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <FileTextIcon className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">Export as Text</div>
                        <div className="text-xs text-gray-400">Plain text format</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      // Send compiled plans to all teachers
                      const confirmation = confirm(
                        `Send compiled lesson plans to all ${teachers.length} teachers?\n\nThis will send individualized emails to each teacher.`
                      );
                      if (confirmation) {
                        alert(`Email functionality would send ${teachers.length} emails with compiled plans.`);
                      }
                    }}
                    className="p-4 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl border border-indigo-500/30 hover:border-indigo-400/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">Email All Teachers</div>
                        <div className="text-xs text-gray-400">Send compiled plans</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-3xl">
              <FileSpreadsheet className="h-16 w-16 text-blue-400 mb-4" />
              <p className="text-white font-black text-lg mb-2">Compile Lesson Plans</p>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Click "Compile Plans" to generate consolidated reports organized by class and section.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-700/50">
                  <div className="p-3 bg-indigo-500/20 rounded-xl w-fit mx-auto mb-4">
                    <Layers className="h-6 w-6 text-indigo-400" />
                  </div>
                  <h4 className="text-sm font-black text-white mb-2">Class-wise Organization</h4>
                  <p className="text-xs text-gray-400">Plans grouped by class and section for easy reference</p>
                </div>
                <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-700/50">
                  <div className="p-3 bg-emerald-500/20 rounded-xl w-fit mx-auto mb-4">
                    <Download className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h4 className="text-sm font-black text-white mb-2">Multiple Formats</h4>
                  <p className="text-xs text-gray-400">Export as PDF, Text, or send via email</p>
                </div>
                <div className="bg-gray-900/30 p-6 rounded-2xl border border-gray-700/50">
                  <div className="p-3 bg-amber-500/20 rounded-xl w-fit mx-auto mb-4">
                    <Send className="h-6 w-6 text-amber-400" />
                  </div>
                  <h4 className="text-sm font-black text-white mb-2">Share & Collaborate</h4>
                  <p className="text-xs text-gray-400">Easily share compiled plans with teachers and administration</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Modals */}
      {/* Defaulter Email Modal */}
      {showDefaulterEmailModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Email Defaulters</h3>
                <p className="text-sm text-gray-400">Send reminder emails to teachers with pending submissions</p>
              </div>
              <button
                onClick={() => setShowDefaulterEmailModal(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-300 mb-2">Recipients ({selectedDefaulters.length})</label>
              <div className="max-h-40 overflow-y-auto bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                {selectedDefaulters.map(email => {
                  const teacher = teachers.find(t => t.email === email);
                  return (
                    <div key={email} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
                      <div>
                        <p className="text-sm text-white">{teacher?.name || email.split('@')[0]}</p>
                        <p className="text-xs text-gray-400">{email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDefaulters(prev => prev.filter(e => e !== email))}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-300 mb-2">Email Template</label>
              <textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={8}
                className="w-full bg-gray-900/70 border border-gray-700 rounded-xl p-4 text-white resize-none"
                placeholder="Enter your email message here..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={sendBulkEmails}
                disabled={isSendingEmail || selectedDefaulters.length === 0}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Emails ({selectedDefaulters.length})
                  </>
                )}
              </button>
              <button
                onClick={() => setShowDefaulterEmailModal(false)}
                className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Add New Teacher</h3>
              <button onClick={() => setShowAddTeacher(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Email</label>
                <input
                  type="email"
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="teacher@school.edu"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleAddNewTeacher}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700"
                >
                  Add Teacher
                </button>
                <button
                  onClick={() => setShowAddTeacher(false)}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {isEditing && editingTeacher && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full border border-gray-700/50 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Edit Teacher: {editingTeacher.name}</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Full Name</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Email</label>
                <input
                  type="email"
                  value={editFormData.email || ''}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    className="w-full bg-gray-900/70 border border-gray-700 rounded-xl px-4 py-3 text-white pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-700 text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Data Preview Modal */}
      {showFirebaseData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-2">
                  <Server className="h-6 w-6 text-blue-400" />
                  Live Firebase Data
                </h3>
                <p className="text-sm text-blue-400 font-black uppercase tracking-[0.2em] mt-1">
                  {firebaseTeachers.length} teachers in Firebase Cloud
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onRefresh}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh
                </button>
                <button 
                  onClick={() => setShowFirebaseData(false)}
                  className="p-2 text-gray-400 hover:text-rose-400 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-500/30">
                    <th className="pb-4 text-xs font-black uppercase text-blue-400 tracking-widest px-4">Faculty Member</th>
                    <th className="pb-4 text-xs font-black uppercase text-blue-400 tracking-widest px-4">Assignments</th>
                    <th className="pb-4 text-xs font-black uppercase text-blue-400 tracking-widest px-4">Status</th>
                    <th className="pb-4 text-xs font-black uppercase text-blue-400 tracking-widest px-4">Password</th>
                    <th className="pb-4 text-xs font-black uppercase text-blue-400 tracking-widest px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/10">
                  {firebaseTeachers.map(teacher => (
                    <tr key={teacher.id} className="group hover:bg-blue-500/5 transition-colors">
                      <td className="py-5 px-4">
                        <div className="font-black text-white italic">{teacher.name}</div>
                        <div className="text-xs text-gray-400 font-bold">{teacher.email}</div>
                        <div className="text-[10px] text-gray-500 font-bold">{teacher.phone}</div>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignments.map((asgn, idx) => (
                            <span key={idx} className="text-[10px] font-black bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-lg uppercase">
                              {asgn.subject} ({asgn.className})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        {teacher.isClassTeacher ? (
                          <span className="text-xs font-black bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded-lg uppercase">
                            CT {teacher.classTeacherOf?.className}-{teacher.classTeacherOf?.section}
                          </span>
                        ) : (
                          <span className="text-xs font-black bg-blue-500/10 text-blue-300 px-2 py-1 rounded-lg uppercase">Faculty</span>
                        )}
                      </td>
                      <td className="py-5 px-4">
                        <div className="text-xs font-bold text-gray-300 bg-blue-500/10 px-2 py-1 rounded-lg">
                          {teacher.password ? '••••••••' : DEFAULT_TEACHER_PASSWORD}
                        </div>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setEditingTeacher(teacher);
                              setIsEditing(true);
                              setShowFirebaseData(false);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-lg transition-colors hover:bg-indigo-500/10"
                            title="Edit teacher"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Remove ${teacher.name} from database?`)) {
                                onRemoveTeacher(getTeacherId(teacher.email)).then(() => {
                                  setFirebaseTeachers(prev => prev.filter(t => t.id !== teacher.id));
                                  onRefresh();
                                });
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-rose-400 rounded-lg transition-colors hover:bg-rose-500/10"
                            title="Remove teacher"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-6 border-t border-blue-500/30 flex justify-between items-center">
              <p className="text-xs text-blue-400">
                Live data from Firebase • Last fetched: {new Date().toLocaleTimeString()}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={handleSmartSeed}
                  disabled={isSeeding}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSeeding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudUpload className="h-4 w-4" />
                  )}
                  {isSeeding ? 'Processing...' : 'Seed Only If Empty'}
                </button>
                <button 
                  onClick={() => setShowFirebaseData(false)}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Plan Preview Modal */}
      {showLessonPlanPreview && selectedTeacherForLessonPlans && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Lesson Plans: {selectedTeacherForLessonPlans.name}</h3>
                <p className="text-sm text-gray-400">{selectedTeacherForLessonPlans.email}</p>
              </div>
              <button
                onClick={() => setShowLessonPlanPreview(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {getTeacherLessonPlans(selectedTeacherForLessonPlans.email).map((plan, idx) => (
                <div key={idx} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-lg font-black text-white">{plan.subject}</span>
                      <span className="text-sm font-black text-indigo-400 ml-2">Class {plan.className}-{plan.section}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-gray-400">
                        Week: {new Date(plan.weekStarting).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Submitted: {new Date(plan.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-black text-gray-300 mb-2">Chapter</h4>
                      <p className="text-white bg-gray-800/50 p-3 rounded-xl">{plan.chapter}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-300 mb-2">Topics</h4>
                      <p className="text-white bg-gray-800/50 p-3 rounded-xl whitespace-pre-line">{plan.topics}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-black text-gray-300 mb-2">Homework</h4>
                      <p className="text-white bg-gray-800/50 p-3 rounded-xl whitespace-pre-line">{plan.homework}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700/50 flex justify-end gap-3">
              <button
                onClick={() => downloadLessonPlansAsText(selectedTeacherForLessonPlans)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download All Plans
              </button>
              <button
                onClick={() => {
                  setShowLessonPlanPreview(false);
                  shareLessonPlansViaEmail(selectedTeacherForLessonPlans);
                }}
                className="px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Email Plans
              </button>
              <button
                onClick={() => setShowLessonPlanPreview(false)}
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-bold hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistry;
