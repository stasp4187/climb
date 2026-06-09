import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Difficulty, Trail } from '../common/types';

const commonsFileUrl = (title: string) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title)}`;

interface TrailFilters {
  q?: string;
  difficulty?: Difficulty;
  minDistance?: number;
  maxDistance?: number;
  tag?: string;
}

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

@Injectable()
export class TrailsService implements OnModuleInit {
  private readonly logger = new Logger(TrailsService.name);
  private readonly photosCache = new Map<string, string[]>();
  private readonly useDynamicSources = process.env.TRAILS_DYNAMIC_SOURCES === 'true';
  private readonly trailWikiTitles: Record<string, string[]> = {
    'hoverla-summit-route': ['Говерла', 'Чорногора'],
    'synevir-lake-loop': ['Синевир', 'Національний природний парк Синевир'],
    'dnister-canyon-ridge': ['Дністровський каньйон'],
    'pip-ivan-chornohora': ['Піп Іван', 'Чорногора'],
    'gorgany-arshytsia-loop': ['Ґорґани', 'Аршиця'],
    'shatsk-lakes-eco-path': ['Шацький національний природний парк', 'Шацькі озера'],
    'tustan-fortress-trail': ['Тустань'],
    'bakota-cliffs-route': ['Бакота'],
    'aktove-canyon-trail': ['Актівський каньйон'],
    'kamianets-castle-rim': ['Камʼянець-Подільська фортеця', 'Смотрицький каньйон'],
    'medobory-nature-trail': ['Медобори'],
    'svydovets-ridge': ['Свидовець'],
    'skole-beskyd-waterfall': ['Водоспад Камʼянка', 'Сколівські Бескиди'],
    'oleshky-dunes-route': ['Олешківські піски'],
    'khortytsia-island-trail': ['Хортиця'],
  };
  private readonly trailCommonsCategories: Record<string, string[]> = {
    'hoverla-summit-route': ['Hoverla', 'Chornohora'],
    'synevir-lake-loop': ['Synevyr', 'National Nature Park Synevyr'],
    'dnister-canyon-ridge': ['Dniester Canyon'],
    'pip-ivan-chornohora': ['Pip Ivan Chornohirskyi'],
    'gorgany-arshytsia-loop': ['Gorgany', 'Arshytsia'],
    'shatsk-lakes-eco-path': ['Shatsk National Natural Park', 'Shatsk Lakes'],
    'tustan-fortress-trail': ['Tustan'],
    'khortytsia-island-trail': ['Khortytsia'],
    'aktove-canyon-trail': ['Aktove canyon'],
    'bakota-cliffs-route': ['Bakota'],
    'kamianets-castle-rim': ['Kamianets-Podilskyi Castle', 'Smotrych Canyon'],
    'medobory-nature-trail': ['Medobory Nature Reserve'],
    'svydovets-ridge': ['Svydovets'],
    'skole-beskyd-waterfall': ['Kamianka Waterfall', 'Skole Beskids National Nature Park'],
    'oleshky-dunes-route': ['Oleshky Sands'],
  };
  private readonly trailCommonsSearch: Record<string, { query: string; include: string[]; exclude: string[] }> = {
    'synevir-lake-loop': {
      query: 'Synevyr lake',
      include: ['synevyr', 'синевир', 'lake', 'озеро'],
      exclude: ['synagogue', 'cemetery', 'gerb', 'prapor', 'coat of arms', 'flag'],
    },
    'hoverla-summit-route': {
      query: 'Hoverla Chornohora',
      include: ['hoverla', 'говерл', 'чорногор', 'chornohora'],
      exclude: ['map', 'logo', 'coat of arms', 'flag'],
    },
    'pip-ivan-chornohora': {
      query: 'Pip Ivan Chornohora',
      include: ['pip', 'ivan', 'чорногор', 'чорногора'],
      exclude: ['map', 'logo', 'coat of arms', 'flag'],
    },
    'bakota-cliffs-route': {
      query: 'Bakota Dniester',
      include: ['bakota', 'бакот', 'dniester', 'дністер'],
      exclude: ['map', 'logo'],
    },
  };
  private readonly trailCuratedFileTitles: Record<string, string[]> = {
    'hoverla-summit-route': [
      'File:Гора Говерла після заходу сонця.jpg',
      'File:Hoverla view.jpg',
      'File:Говерла та Чорногірський масив.jpg',
      'File:Говерла.jpg',
      'File:Гора Говерла над хмарами.jpg',
      'File:Говерла після дощу.jpg',
      'File:Climbers on the Mt Hoverla Jan 24 2009.jpg',
      'File:Short break in climbing Mt Hoverla Jan 24 2009.jpg',
    ],
    'synevir-lake-loop': [
      'File:21-224-5054 Synevyr Lake RB 18.jpg',
      'File:Synevyr lake.jpg',
      'File:Synevyr Lake rafts.jpg',
      'File:Synevyr lake 1.jpg',
      'File:Synevyr-1.jpg',
      'File:Mists on Synevyr Lake.jpg',
      'File:Synevyr Lake (Oct 2018) 1.jpg',
      'File:Synevyr Lake (Oct 2018) 2.jpg',
      'File:Synevyr Lake (Oct 2018) 3.jpg',
      'File:Synevyr Lake (Oct 2018) 4.jpg',
      'File:Synevyr Lake IMG 3124.jpg',
      'File:Synevyr Lake IMG 3125.jpg',
    ],
    'dnister-canyon-ridge': [
      'File:61-208-5089 NNP Dnister Canyon 3 RB.jpg',
      'File:61-208-5089 Dniester Canyon RB 18.jpg',
      'File:61-208-5089 Dniester Canyon 2 RB 18 1.jpg',
      'File:Dniester canyon-4.JPG',
      'File:Dniester canyon-3.JPG',
      'File:Dniester canyon-2.JPG',
      'File:Dniester canyon-1.JPG',
      'File:61-208-5089 NNP Dnister Canyon 2 RB.jpg',
      'File:RLP Dniester Canyon RB 18.jpg',
      'File:Dniester Canyon near Khmeleva village RB.jpg',
      'File:Dniester Canyon near Zalishchyky (6).jpg',
      'File:Regional landscape park Dniester Canyon near Koropets.jpg',
    ],
    'pip-ivan-chornohora': [
      'File:Pip Ivan (Chornogora).JPG',
      'File:Pip-Ivan.jpg',
      'File:Pip Ivan.jpg',
      'File:WLE - 2023 - Карпатський Біосферний Заповідник - 02 - Піп Іван Чорногірський.jpg',
      'File:Crocus heuffelianus near Pip Ivan of Chornohora.jpg',
    ],
    'gorgany-arshytsia-loop': [
      'File:Ґорґани хребет Аршиця.jpg',
      'File:О.Аршиця.jpg',
      'File:Полонина Мшана.JPG',
      'File:Рожевий ранок в Ґорґанах.jpg',
      'File:Gorgany IF-1.JPG',
      'File:Г. Студенець.jpg',
      'File:Сивуля Горгани 01.jpg',
      'File:Хомяк.jpg',
      'File:Горгани заповідник.jpg',
      'File:Полонина Хом\'яків.jpg',
    ],
    'shatsk-lakes-eco-path': [
      'File:Big Black Lake on the southwestern outskirts of Shatsk, Ukraine.JPG',
      'File:Озеро Карасинець.jpg',
      'File:Одне з Шацьких озер 2.JPG',
      'File:Shatsk.jpg',
      'File:Lyutsymer Lake in south-eastern edge of Shatsk, Ukraine.JPG',
      'File:Svitiaz Kovelskyi Volynska-Shatskyi NPP-Svitiaz lake-near pansion Shatski ozera-1.jpg',
    ],
    'tustan-fortress-trail': [
      'File:Rocks of Tustan 04.jpg',
      'File:Rocks of Tustan 09.jpg',
      'File:Rocks of Tustan 11.jpg',
      'File:Rocks of Tustan 05.jpg',
      'File:Rocks of Tustan 03.jpg',
      'File:Rocks of Tustan 06.jpg',
      'File:Rocks of Tustan 02.jpg',
      'File:Rocks of Tustan 08.jpg',
      'File:Rocks of Tustan 10.jpg',
      'File:Rocks of Tustan 07.jpg',
      'File:Rocks of Tustan 12.jpg',
      'File:Rocks of Tustan 01.jpg',
    ],
    'bakota-cliffs-route': [
      'File:Bakota bay-05.jpg',
      'File:Bakota bay-02.jpg',
      'File:Bakota Bay-01.jpg',
      'File:Bakota bay-03.jpg',
      'File:Bakota bay-04.jpg',
      'File:Bakota Dnister.jpg',
      'File:Bakota.jpg',
      'File:Sunset in the Dnister Canyon.jpg',
      'File:Захід сонця на Дністрі.jpg',
      'File:Dnister.jpg',
    ],
    'aktove-canyon-trail': [
      'File:Актовський каньйон восени (3).jpg',
      'File:2FC574AD-41D7-4C80-93FF-F3E519D.jpg',
      'File:Aktove Canyon 1.jpg',
      'File:Aktove canyon 2.jpg',
      'File:Актівський каньйон скелі.jpg',
      'File:Актівський каньйон вид на скелі.jpg',
      'File:Актовський каньйон. Миколаївська область. 02.jpg',
      'File:Актівський каньйон.jpg',
      'File:Актовський каньйон. Миколаївська область. 04.jpg',
      'File:Актовський каньйон. Миколаївська область. 01.jpg',
      'File:Скелі Актово.jpg',
    ],
    'kamianets-castle-rim': [
      'File:Kamianets-Podilskyi banner-001.jpg',
      'File:=8=Kamianets-Podilskyi Castle and Fortress -2018-05-20=consideration in HR=.jpg',
      'File:=7=Kamianets-Podilskyi Castle and Fortress -2018-05-20=general view=.jpg',
      'File:=5=Canyon of the Smotrych River beside the Old Castle and Fortress=2018-05-20=.jpg',
      'File:=6=View from the Castle Bridge on the panorama in the bend of the Smotrych canyon=2018-05-20=.jpg',
      'File:=4=Canyon of the Smotrych River=2018-05-20=.jpg',
      'File:View from the Novoplanovsky Bridge above Smotrich=2018-05-20=.jpg',
      'File:Вежа на обриві великого каньйону Поділля.jpg',
      'File:68-104-0267 Kamianec Podilsky SAM 0905.jpg',
      'File:=2=View from the Novoplanovsky Bridge above Smotrich=2018-05-20=.jpg',
    ],
    'medobory-nature-trail': [
      'File:Medobory Nature Reserve (4).JPG',
      'File:Medobory zap.jpg',
      'File:Medobory Nature Reserve (2).JPG',
      'File:Медобори, екостежка.jpg',
      'File:Медобори, скелі.jpg',
      'File:Медобори, річка Збруч.jpg',
      'File:Медобори5.JPG',
      'File:Medobory 21.jpg',
      'File:Гора Соколиха в Медоборах.jpg',
      'File:Arum medobory 00.jpg',
      'File:Medobory 04.jpg',
    ],
    'svydovets-ridge': [
      'File:Початок водоспаду з озера Герешаська.jpg',
      'File:Драгобратський водоспад.jpg',
      'File:MGP4406 IMGP4408 Водоспад з боку Близниць міні.jpg',
      'File:21-236-5096 Водоспад Свидовець.jpg',
      'File:Весняний Свидовець.JPG',
      'File:Ворожеска хр свидовець.jpg',
      'File:Близниці, Свідовецький хребет, Україна.jpg',
      'File:Ранок на Свидовці.JPG',
      'File:Svydovec, Drahobrat, Gorgany.jpg',
      'File:View from the Velyka Blysnytsya mountain to Dragobrat and the Ivor lake.jpg',
      'File:Зимовий вечір на Драгобраті.jpg',
      'File:Svydovec, Blyznycja, jih.jpg',
      'File:Озеро Івор. Свидовець.jpg',
      'File:Озеро Ворожеське, Свидовець.JPG',
      'File:Озеро Ворожеска Свидовець.jpg',
    ],
    'skole-beskyd-waterfall': [
      'File:Kamianka Waterfall (Apr 2024) 3.jpg',
      'File:Kamianka Waterfall (Jun 2024) 2.jpg',
      'File:Kamianka Waterfall (Jun 2024) 1.jpg',
      'File:Kamianka Waterfall (Apr 2024) 1.jpg',
      'File:Kamianka Waterfall (Apr 2024) 2.jpg',
      'File:Kamianka Verkhnii Waterfall (Jun 2024).jpg',
      'File:Kamianka River in Skole Beskydy (Oct 2024) 1.jpg',
      'File:Водоспад Кам\'янка.jpg',
    ],
    'oleshky-dunes-route': [
      'File:Oleshky sands, Ukraine.jpg',
      'File:Олешківські піски DSC5347.jpg',
      'File:Олешківські піски DJI 0135.jpg',
      'File:Олешківські піски DSC5337.jpg',
      'File:Олешківські піски DSC5341.jpg',
      'File:Олешківські піски DSC5343.jpg',
      'File:Олешківські піски DSC5332.jpg',
      'File:Херсонська область, Національний природний парк Олешківські піски. Автор Гаврилюк С. В. (5).JPG',
      'File:Oleshky Sands 16 (YDS 0503).jpg',
      'File:Oleshky Sands 38 (YDS 0483).jpg',
      'File:Oleshky Sands 12 (YDS 0489).jpg',
      'File:Oleshky Sands 40 (YDS 0439).jpg',
      'File:Oleshky Sands 20 (YDS 0513).jpg',
      'File:Oleshky Sands 22 (YDS 0512).jpg',
      'File:Oleshky Sands 58 (YDS 0612).jpg',
    ],
    'khortytsia-island-trail': [
      'File:Khortytsia 2021 G7.jpg',
      'File:Khortytsia 2021 G2.jpg',
      'File:Khortytsia 2021 G3.jpg',
      'File:Khortytsia 2021 G4.jpg',
      'File:Khortytsia 2021 G6.jpg',
      'File:Khortytsia 2021 G1.jpg',
      'File:Khortytsia-M.jpg',
      'File:Dnipro Khortytsya.jpg',
      'File:Khortytsia Island from space.jpg',
    ],
  };

  private trails: Trail[] = [
    { id: 'trail-1', slug: 'hoverla-summit-route', name: 'Маршрут на Говерлу', region: 'Карпати', country: 'Україна', difficulty: 'hard', distanceKm: 14.2, elevationM: 1240, durationHours: 7.2, coordinates: [48.1604, 24.4999], tags: ['гори', 'панорами', 'вершина'], coverImage: commonsFileUrl('File:Говерла та Чорногірський масив.jpg'), summary: 'Високогірний маршрут на найвищу вершину України з довгими панорамними ділянками.', routeType: 'out-and-back', reviews: [{ id: 'r-1', userId: 'u-1', userName: 'Іра Мельник', rating: 5, comment: 'Крутий підйом, але світанок на вершині неймовірний.', date: '2026-04-20' }] },
    { id: 'trail-2', slug: 'synevir-lake-loop', name: 'Коло навколо озера Синевир', region: 'Закарпаття', country: 'Україна', difficulty: 'easy', distanceKm: 4.8, elevationM: 180, durationHours: 1.8, coordinates: [48.6179, 23.6899], tags: ['озеро', 'сімейний', 'ліс'], coverImage: commonsFileUrl('File:21-224-5054 Synevyr Lake RB 18.jpg'), summary: 'Легкий мальовничий круговий маршрут довкола озера через хвойний ліс.', routeType: 'loop', reviews: [] },
    { id: 'trail-3', slug: 'dnister-canyon-ridge', name: 'Хребет Дністровського каньйону', region: 'Тернопільщина', country: 'Україна', difficulty: 'moderate', distanceKm: 11.5, elevationM: 420, durationHours: 4.5, coordinates: [48.808, 25.612], tags: ['річка', 'хребет', 'фото'], coverImage: commonsFileUrl('File:61-208-5089 NNP Dnister Canyon 3 RB.jpg'), summary: 'Хвилястий маршрут хребтом з оглядовими точками на каньйон і річку.', routeType: 'point-to-point', reviews: [] },
    { id: 'trail-4', slug: 'pip-ivan-chornohora', name: 'Піп Іван Чорногірський', region: 'Івано-Франківщина', country: 'Україна', difficulty: 'hard', distanceKm: 15.7, elevationM: 1080, durationHours: 7.8, coordinates: [48.0438, 24.6275], tags: ['гори', 'альпійський', 'обсерваторія'], coverImage: commonsFileUrl('File:Pip Ivan (Chornogora).JPG'), summary: 'Висотний маршрут до вершини Піп Іван з панорамними хребтами та руїнами обсерваторії.', routeType: 'out-and-back', reviews: [] },
    { id: 'trail-5', slug: 'gorgany-arshytsia-loop', name: 'Коло Горганами: Аршиця', region: 'Карпати', country: 'Україна', difficulty: 'hard', distanceKm: 18.3, elevationM: 1320, durationHours: 9.1, coordinates: [48.6561, 24.1765], tags: ['гори', 'дика природа', 'камені'], coverImage: commonsFileUrl('File:Ґорґани хребет Аршиця.jpg'), summary: 'Складний гірський трек через камʼянисті ділянки та смерекові ліси Горган.', routeType: 'loop', reviews: [] },
    { id: 'trail-6', slug: 'shatsk-lakes-eco-path', name: 'Екостежка Шацьких озер', region: 'Волинь', country: 'Україна', difficulty: 'easy', distanceKm: 6.2, elevationM: 95, durationHours: 2.1, coordinates: [51.5008, 23.8582], tags: ['озеро', 'екостежка', 'сімейний'], coverImage: commonsFileUrl('File:Big Black Lake on the southwestern outskirts of Shatsk, Ukraine.JPG'), summary: 'Легка прогулянкова стежка біля озер із спостереженням за птахами.', routeType: 'loop', reviews: [] },
    { id: 'trail-7', slug: 'tustan-fortress-trail', name: 'Стежка до Тустані', region: 'Львівщина', country: 'Україна', difficulty: 'easy', distanceKm: 5.4, elevationM: 240, durationHours: 2.0, coordinates: [49.1798, 23.3916], tags: ['скелі', 'історія', 'оглядові точки'], coverImage: commonsFileUrl('File:Rocks of Tustan 04.jpg'), summary: 'Маршрут до скельного комплексу Тустань із панорамою Бескидів.', routeType: 'out-and-back', reviews: [] },
    { id: 'trail-8', slug: 'bakota-cliffs-route', name: 'Маршрут до скель Бакоти', region: 'Хмельниччина', country: 'Україна', difficulty: 'moderate', distanceKm: 9.7, elevationM: 360, durationHours: 3.9, coordinates: [48.5797, 26.9873], tags: ['каньйон', 'скелі', 'фото'], coverImage: commonsFileUrl('File:Bakota bay-05.jpg'), summary: 'Стежка вздовж Дністровських краєвидів із виходом на оглядові скелі.', routeType: 'point-to-point', reviews: [] },
    { id: 'trail-9', slug: 'aktove-canyon-trail', name: 'Актівський каньйон', region: 'Миколаївщина', country: 'Україна', difficulty: 'moderate', distanceKm: 8.9, elevationM: 290, durationHours: 3.4, coordinates: [47.7094, 31.2018], tags: ['каньйон', 'скелі', 'річка'], coverImage: commonsFileUrl('File:Актовський каньйон восени (3).jpg'), summary: 'Скельні пейзажі степової України та маршрут вздовж річки Мертвовод.', routeType: 'loop', reviews: [] },
    { id: 'trail-10', slug: 'kamianets-castle-rim', name: 'Коло каньйоном Камʼянця', region: 'Поділля', country: 'Україна', difficulty: 'easy', distanceKm: 7.1, elevationM: 210, durationHours: 2.5, coordinates: [48.6766, 26.5842], tags: ['місто', 'каньйон', 'історія'], coverImage: commonsFileUrl('File:Kamianets-Podilskyi banner-001.jpg'), summary: 'Прогулянковий маршрут навколо каньйону Смотрича та фортеці.', routeType: 'loop', reviews: [] },
    { id: 'trail-11', slug: 'medobory-nature-trail', name: 'Природна стежка Медобори', region: 'Тернопільщина', country: 'Україна', difficulty: 'easy', distanceKm: 6.8, elevationM: 170, durationHours: 2.2, coordinates: [49.1894, 26.1094], tags: ['ліс', 'заповідник', 'птахи'], coverImage: commonsFileUrl('File:Medobory Nature Reserve (4).JPG'), summary: 'Тихий маршрут крізь букові ліси природного заповідника.', routeType: 'loop', reviews: [] },
    { id: 'trail-12', slug: 'svydovets-ridge', name: 'Хребет Свидовець', region: 'Закарпаття', country: 'Україна', difficulty: 'hard', distanceKm: 21.4, elevationM: 1410, durationHours: 10.2, coordinates: [48.2489, 24.2268], tags: ['гори', 'озера', 'полонини'], coverImage: commonsFileUrl('File:Озеро Івор. Свидовець.jpg'), summary: 'Тривалий трек полонинами та льодовиковими озерами Свидовця.', routeType: 'point-to-point', reviews: [] },
    { id: 'trail-13', slug: 'skole-beskyd-waterfall', name: 'Стежка на Камʼянський водоспад', region: 'Львівщина', country: 'Україна', difficulty: 'easy', distanceKm: 4.9, elevationM: 140, durationHours: 1.7, coordinates: [49.0206, 23.4613], tags: ['водоспад', 'ліс', 'сімейний'], coverImage: commonsFileUrl('File:Kamianka Waterfall (Apr 2024) 3.jpg'), summary: 'Короткий маршрут до каскадного водоспаду в нацпарку Сколівські Бескиди.', routeType: 'out-and-back', reviews: [] },
    { id: 'trail-14', slug: 'oleshky-dunes-route', name: 'Маршрут Олешківськими пісками', region: 'Херсонщина', country: 'Україна', difficulty: 'moderate', distanceKm: 10.1, elevationM: 130, durationHours: 3.8, coordinates: [46.5836, 32.7398], tags: ['пустеля', 'піски', 'степ'], coverImage: commonsFileUrl('File:Oleshky sands, Ukraine.jpg'), summary: 'Незвичний піщаний маршрут найбільшим піщаним масивом України.', routeType: 'loop', reviews: [] },
    { id: 'trail-15', slug: 'khortytsia-island-trail', name: 'Острів Хортиця: берегова стежка', region: 'Запоріжжя', country: 'Україна', difficulty: 'easy', distanceKm: 8.3, elevationM: 115, durationHours: 2.9, coordinates: [47.8344, 35.1055], tags: ['острів', 'степ', 'історія'], coverImage: commonsFileUrl('File:Khortytsia 2021 G7.jpg'), summary: 'Прогулянка береговими кручами Хортиці з краєвидами Дніпра.', routeType: 'loop', reviews: [] },
  ];

  async onModuleInit() {
    if (!this.useDynamicSources) {
      this.logger.log('Trails dynamic sources are disabled');
      return;
    }
    await this.appendTrailsFromOverpass();
    await this.hydrateTrailCoverImages();
  }

  findAll(filters: TrailFilters): Trail[] {
    return this.trails.filter((trail) => {
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const haystack = `${trail.name} ${trail.region} ${trail.tags.join(' ')}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.difficulty && trail.difficulty !== filters.difficulty) return false;
      if (filters.minDistance && trail.distanceKm < filters.minDistance) return false;
      if (filters.maxDistance && trail.distanceKm > filters.maxDistance) return false;
      if (filters.tag && !trail.tags.includes(filters.tag)) return false;
      return true;
    });
  }

  findOne(idOrSlug: string): Trail {
    const trail = this.trails.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
    if (!trail) throw new NotFoundException('Маршрут не знайдено');
    return trail;
  }

  addReview(idOrSlug: string, input: { userId: string; userName: string; rating: number; comment: string }): Trail {
    const trail = this.findOne(idOrSlug);
    trail.reviews.unshift({ id: uuidv4(), date: new Date().toISOString().slice(0, 10), ...input });
    return trail;
  }

  async getTrailPhotos(idOrSlug: string): Promise<string[]> {
    const trail = this.findOne(idOrSlug);
    const cacheKey = trail.id;
    const cached = this.photosCache.get(cacheKey);
    if (cached && cached.length > 0) return cached;

    const curated = this.fetchCuratedTrailPhotos(trail);
    if (!this.useDynamicSources) {
      const staticPhotos = Array.from(new Set([trail.coverImage, ...curated])).filter((photo) => this.isModernPhoto(photo)).slice(0, 20);
      this.photosCache.set(cacheKey, staticPhotos);
      return staticPhotos;
    }

    const categoryPhotos = await this.fetchTrailCategoryPhotos(trail);
    const wikiPhotos = await this.fetchTrailWikiPhotos(trail);
    const photos = await this.fetchCommonsGallery(trail.coordinates[0], trail.coordinates[1], trail);
    const nearby = await this.fetchWikipediaNearbyPhotos(trail.coordinates[0], trail.coordinates[1], trail);
    const searched = await this.fetchCommonsSearchPhotos(trail);
    let unique = Array.from(
      new Set([trail.coverImage, ...curated, ...categoryPhotos, ...wikiPhotos, ...photos, ...nearby, ...searched]),
    )
      .filter((photo) => this.isModernPhoto(photo))
      .slice(0, 20);

    if (unique.length < 6) {
      const local = await this.fetchLocalCommonsPhotos(trail.coordinates[0], trail.coordinates[1]);
      unique = Array.from(new Set([...unique, ...local])).filter((photo) => this.isModernPhoto(photo)).slice(0, 20);
    }

    this.photosCache.set(cacheKey, unique);
    return unique;
  }

  private async appendTrailsFromOverpass() {
    const query = '[out:json][timeout:12];area["ISO3166-1"="UA"][admin_level=2]->.a;(relation["route"="hiking"](area.a);way["highway"~"path|track"]["name"](area.a););out tags center 80;';
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: query,
      });
      if (!response.ok) {
        this.logger.warn(`Overpass API responded with ${response.status}`);
        return;
      }

      const payload = (await response.json()) as { elements?: OverpassElement[] };
      const elements = payload.elements ?? [];
      const existingNames = new Set(this.trails.map((t) => t.name.toLowerCase()));
      const externalTrails: Trail[] = [];

      for (const el of elements) {
        const name = el.tags?.name?.trim();
        const lat = el.center?.lat ?? el.lat;
        const lon = el.center?.lon ?? el.lon;
        if (!name || lat === undefined || lon === undefined) continue;
        if (existingNames.has(name.toLowerCase())) continue;

        const idx = externalTrails.length + 1;
        externalTrails.push({
          id: `osm-${el.id}`,
          slug: `osm-ua-trail-${el.id}`,
          name,
          region: el.tags?.['addr:region'] ?? 'Україна',
          country: 'Україна',
          difficulty: idx % 5 === 0 ? 'hard' : idx % 2 === 0 ? 'moderate' : 'easy',
          distanceKm: Number((4 + (idx % 15) * 1.2).toFixed(1)),
          elevationM: 100 + (idx % 12) * 95,
          durationHours: Number((1.6 + (idx % 9) * 0.7).toFixed(1)),
          coordinates: [lat, lon],
          tags: ['osm', 'україна', 'трекинг'],
          coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
          summary: 'Маршрут автоматично додано з відкритих картографічних даних OpenStreetMap.',
          routeType: idx % 3 === 0 ? 'point-to-point' : idx % 2 === 0 ? 'out-and-back' : 'loop',
          reviews: [],
        });

        if (externalTrails.length >= 40) break;
      }

      this.trails = [...this.trails, ...externalTrails];
      this.logger.log(`Loaded ${externalTrails.length} extra Ukrainian routes from Overpass API`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not load Overpass routes: ${message}`);
    }
  }

  private async hydrateTrailCoverImages() {
    let updated = 0;
    for (const trail of this.trails) {
      const isGeneric = trail.coverImage.includes('images.unsplash.com');
      if (!isGeneric) continue;
      const resolved = await this.resolveCoverFromGeodata(trail.coordinates[0], trail.coordinates[1]);
      if (!resolved) continue;
      trail.coverImage = resolved;
      updated += 1;
      if (updated >= 30) break;
    }
    this.logger.log(`Updated ${updated} trail cover images from geo sources`);
  }

  private async resolveCoverFromGeodata(lat: number, lon: number): Promise<string | null> {
    const commons = await this.fetchCommonsImage(lat, lon);
    if (commons) return commons;
    const wiki = await this.fetchWikipediaImage(lat, lon);
    if (wiki) return wiki;
    return null;
  }

  private async fetchCommonsImage(lat: number, lon: number): Promise<string | null> {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=geosearch` +
      `&ggscoord=${lat}|${lon}&ggsradius=10000&ggslimit=5&ggsnamespace=6` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=1400&origin=*`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        query?: {
          pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }>;
        };
      };
      const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
      for (const page of pages) {
        const img = page.imageinfo?.[0];
        const candidate = img?.thumburl ?? img?.url;
        if (candidate) return candidate;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async fetchWikipediaImage(lat: number, lon: number): Promise<string | null> {
    const url =
      `https://uk.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch` +
      `&ggscoord=${lat}|${lon}&ggsradius=10000&ggslimit=3` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=1400&origin=*`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return null;
      const payload = (await response.json()) as {
        query?: {
          pages?: Record<string, { thumbnail?: { source?: string } }>;
        };
      };
      const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
      for (const page of pages) {
        if (page.thumbnail?.source) return page.thumbnail.source;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async fetchCommonsGallery(lat: number, lon: number, trail: Trail): Promise<string[]> {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=geosearch` +
      `&ggscoord=${lat}|${lon}&ggsradius=15000&ggslimit=30&ggsnamespace=6` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=1600&origin=*`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        query?: {
          pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }>;
        };
      };
      const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
      const tokens = this.buildTrailTokens(trail);
      return pages
        .filter((page) => {
          const title = page.title?.toLowerCase() ?? '';
          return tokens.some((t) => title.includes(t));
        })
        .map((page) => page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url)
        .filter((img): img is string => Boolean(img))
        .filter((img) => !img.toLowerCase().endsWith('.svg'));
    } catch {
      return [];
    }
  }

  private async fetchWikipediaNearbyPhotos(lat: number, lon: number, trail: Trail): Promise<string[]> {
    const url =
      `https://uk.wikipedia.org/w/api.php?action=query&format=json&generator=geosearch` +
      `&ggscoord=${lat}|${lon}&ggsradius=12000&ggslimit=12` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=1600&origin=*`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        query?: { pages?: Record<string, { thumbnail?: { source?: string } }> };
      };
      const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
      const tokens = this.buildTrailTokens(trail);
      return pages
        .filter((page) => {
          const title = (page as { title?: string }).title?.toLowerCase() ?? '';
          return tokens.some((t) => title.includes(t));
        })
        .map((page) => page.thumbnail?.source)
        .filter((img): img is string => Boolean(img));
    } catch {
      return [];
    }
  }

  private buildTrailTokens(trail: Trail): string[] {
    const parts = `${trail.name} ${trail.region} ${trail.country}`
      .toLowerCase()
      .replace(/[^a-zа-яіїєґ0-9\s]/gi, ' ')
      .split(/\s+/)
      .filter((p) => p.length > 3);
    return Array.from(new Set(parts)).slice(0, 8);
  }

  private async fetchTrailWikiPhotos(trail: Trail): Promise<string[]> {
    const titles = this.trailWikiTitles[trail.slug] ?? [trail.name];
    const gallery: string[] = [];
    for (const title of titles) {
      const items = await this.fetchWikipediaPageGallery(title);
      gallery.push(...items);
      if (gallery.length >= 20) break;
    }
    return Array.from(new Set(gallery)).slice(0, 14);
  }

  private async fetchWikipediaPageGallery(title: string): Promise<string[]> {
    try {
      const imagesApi =
        `https://uk.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(title)}` +
        `&prop=images&imlimit=50&origin=*`;
      const imagesRes = await fetch(imagesApi, { signal: AbortSignal.timeout(9000) });
      if (!imagesRes.ok) return [];
      const imagesPayload = (await imagesRes.json()) as {
        query?: { pages?: Record<string, { images?: Array<{ title: string }> }> };
      };
      const pages = imagesPayload.query?.pages ? Object.values(imagesPayload.query.pages) : [];
      const fileTitles = pages.flatMap((p) => (p.images ?? []).map((img) => img.title));
      const filtered = fileTitles.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
      if (!filtered.length) return [];

      const batch = filtered.slice(0, 30).join('|');
      const infoApi =
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(batch)}` +
        `&prop=imageinfo&iiprop=url&iiurlwidth=1800&origin=*`;
      const infoRes = await fetch(infoApi, { signal: AbortSignal.timeout(9000) });
      if (!infoRes.ok) return [];
      const infoPayload = (await infoRes.json()) as {
        query?: {
          pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }>;
        };
      };
      const infoPages = infoPayload.query?.pages ? Object.values(infoPayload.query.pages) : [];
      return infoPages
        .map((p) => p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url)
        .filter((img): img is string => Boolean(img));
    } catch {
      return [];
    }
  }

  private async fetchTrailCategoryPhotos(trail: Trail): Promise<string[]> {
    const categories = this.trailCommonsCategories[trail.slug] ?? [];
    const gallery: string[] = [];
    for (const category of categories) {
      const items = await this.fetchCommonsCategoryPhotos(category);
      gallery.push(...items);
      if (gallery.length >= 24) break;
    }
    return Array.from(new Set(gallery)).slice(0, 18);
  }

  private async fetchCommonsCategoryPhotos(categoryName: string): Promise<string[]> {
    try {
      const membersApi =
        `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${categoryName}`)}` +
        `&cmnamespace=6&cmlimit=40&origin=*`;
      const membersRes = await fetch(membersApi, { signal: AbortSignal.timeout(9000) });
      if (!membersRes.ok) return [];
      const membersPayload = (await membersRes.json()) as {
        query?: { categorymembers?: Array<{ title: string }> };
      };
      const files = membersPayload.query?.categorymembers?.map((m) => m.title) ?? [];
      const filtered = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
      if (!filtered.length) return [];

      const batch = filtered.slice(0, 35).join('|');
      const infoApi =
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(batch)}` +
        `&prop=imageinfo&iiprop=url&iiurlwidth=1800&origin=*`;
      const infoRes = await fetch(infoApi, { signal: AbortSignal.timeout(9000) });
      if (!infoRes.ok) return [];
      const infoPayload = (await infoRes.json()) as {
        query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }> };
      };
      const pages = infoPayload.query?.pages ? Object.values(infoPayload.query.pages) : [];
      return pages
        .map((p) => p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url)
        .filter((img): img is string => Boolean(img));
    } catch {
      return [];
    }
  }

  private async fetchCommonsSearchPhotos(trail: Trail): Promise<string[]> {
    try {
      const cfg = this.trailCommonsSearch[trail.slug];
      const searchText = cfg?.query ?? `${trail.name} ${trail.region}`.trim();
      const searchApi =
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
        `&srnamespace=6&srlimit=30&srsearch=${encodeURIComponent(searchText)}&origin=*`;
      const searchRes = await fetch(searchApi, { signal: AbortSignal.timeout(9000) });
      if (!searchRes.ok) return [];
      const searchPayload = (await searchRes.json()) as {
        query?: { search?: Array<{ title: string }> };
      };
      const include = (cfg?.include ?? this.buildTrailTokens(trail)).map((x) => x.toLowerCase());
      const exclude = (cfg?.exclude ?? []).map((x) => x.toLowerCase());

      const titles = (searchPayload.query?.search ?? [])
        .map((item) => item.title)
        .filter((title) => {
          const t = title.toLowerCase();
          const good = include.some((inc) => t.includes(inc));
          const bad = exclude.some((exc) => t.includes(exc));
          return good && !bad;
        })
        .filter((t) => /\.(jpg|jpeg|png)$/i.test(t))
        .slice(0, 25);
      if (!titles.length) return [];

      const batch = titles.join('|');
      const infoApi =
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(batch)}` +
        `&prop=imageinfo&iiprop=url&iiurlwidth=1800&origin=*`;
      const infoRes = await fetch(infoApi, { signal: AbortSignal.timeout(9000) });
      if (!infoRes.ok) return [];
      const infoPayload = (await infoRes.json()) as {
        query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl?: string; url?: string }> }> };
      };
      const pages = infoPayload.query?.pages ? Object.values(infoPayload.query.pages) : [];
      return pages
        .map((p) => p.imageinfo?.[0]?.thumburl ?? p.imageinfo?.[0]?.url)
        .filter((img): img is string => Boolean(img));
    } catch {
      return [];
    }
  }

  private async fetchLocalCommonsPhotos(lat: number, lon: number): Promise<string[]> {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=geosearch` +
      `&ggscoord=${lat}|${lon}&ggsradius=7000&ggslimit=40&ggsnamespace=6` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=1800&origin=*`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!response.ok) return [];
      const payload = (await response.json()) as {
        query?: {
          pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }>;
        };
      };
      const pages = payload.query?.pages ? Object.values(payload.query.pages) : [];
      const exclude = ['map', 'logo', 'flag', 'coat of arms', 'gerb', 'prapor', 'symbol'];
      return pages
        .filter((page) => {
          const title = page.title?.toLowerCase() ?? '';
          const bad = exclude.some((exc) => title.includes(exc));
          return !bad;
        })
        .map((page) => page.imageinfo?.[0]?.thumburl ?? page.imageinfo?.[0]?.url)
        .filter((img): img is string => Boolean(img))
        .filter((img) => !img.toLowerCase().endsWith('.svg'));
    } catch {
      return [];
    }
  }

  private fetchCuratedTrailPhotos(trail: Trail): string[] {
    const titles = this.trailCuratedFileTitles[trail.slug] ?? [];
    return titles
      .filter((title) => this.isModernPhoto(title))
      .map((title) => commonsFileUrl(title));
  }

  private isModernPhoto(value: string): boolean {
    const text = decodeURIComponent(value).toLowerCase().replace(/_/g, ' ');
    if (/\.(svg|pdf|gif|tif|tiff)(\?|$)/.test(text)) return false;
    const blocked = [
      '1938',
      '1939',
      '1940',
      '1975',
      '1981',
      'archive',
      'archival',
      'historical',
      'historic',
      'old',
      'black_and_white',
      'black-white',
      'monochrome',
      'sepia',
      'bw',
      'stamp',
      'postage',
      'postcard',
      'coin',
      'марка',
      'пошт',
      'silver',
      'аверс',
      'реверс',
      'срібн',
      'podilski tovtry',
      'map',
      'logo',
      'coat of arms',
      'flag',
      'prapor',
      'gerb',
      'прапор',
      'герб',
      'railway station',
      'armoured train',
    ];
    return !blocked.some((token) => text.includes(token));
  }
}
