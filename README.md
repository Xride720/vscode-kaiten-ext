# Kaiten extension
Расширение VSCode которое позволяет:
  - просматривать название и описание карточки Kaiten (связанной с текущей веткой git)
  - просматривать/редатировать учёт времени карточки Kaiten (связанной с текущей веткой git)
  - просматривать/редатировать чек-листы карточки Kaiten (связанной с текущей веткой git)
  - просматривать/редатировать(свои) комментарии карточки Kaiten (связанной с текущей веткой git)

Для работы расширения необходимо заполнить его настройки (Api Key + Url).

## Раздел задача (карточка)
В данном разделе отображается название и описание карточки,
также в заголовке есть ссылка на карточку в Kaiten и кнопка обновления раздела.

## Раздел учёт времени
В данном разделе есть форма для создания и редактирования записей и список самих записей.
В поле комментария есть кнопка при нажатии на которую открывается список из 10-ти последних коммитов,
  при нажатии на один или несколько коммитов их сообщения будут вставлены в поле комментария.
У элементов списка есть две кнопки - редактировать и удалить (появляются при наведении на элемент).
В заголовке раздела есть кнопка обновления (сбрасывает значения формы, загружает обновленный список записей).

## Раздел чек-листы
В данном разделе находятся все чек-листы задачи(карточки) в виде дерева.
В заголовке раздела есть две кнопки - обновить и добавить новый чек-лист.
Узлы дерева соответственно двух типов - чек-лист и пунтк чек-листа.
Узел дерева типа чек-лист имеет три кнопки - редатировать чек-лист, удалить чек-лист и добавить пункт чек-листа.
Узел дерева типа пункт чек-листа имеет две кнопки - редатировать пункт чек-листа и удалить пункт чек-листа,
так же при выборе пункта открывается файл соответсующий ссылке в тексте указанной в формате "\n(## [relativePath] ##)" в конце текста, если такая ссылка в тексте пункта есть.
Для создания пункта чеклиста из коменнтария начинающегося с "// [TODO|FIXME|HACK|BUG]" установите курсор на строку комментария и откройте выпадающее меню (клик мыши по иконке или Ctrl+.).

## Раздел комментарии
В данном разделе находятся список комментариев задачи(карточки) и форма для создания/редактирования.
Редактировать и удалять можно только свои комментарии.
В поле комментария есть кнопка при нажатии на которую открывается список из 10-ти последних коммитов,
  при нажатии на один или несколько коммитов их сообщения будут вставлены в поле комментария.
У элементов списка есть две кнопки - редактировать и удалить (появляются при наведении на элемент).
В заголовке раздела есть кнопка обновления (сбрасывает значения формы, загружает обновленный список записей).