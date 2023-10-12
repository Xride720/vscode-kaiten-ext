export function generateKaitenLink(base: string, branchName: string): string | null {
  const result = /(\d{7,8})/.exec(branchName);
  if (!result) return null;
  return `${base}/${result[1]}`;
}

export const formatUrl = (url?: string) => {
  return url?.endsWith('/') ? url.slice(0, url.length - 1) : url;
};

export const convertKaitenDescription = (desc: string) => {
  return desc.replaceAll(/\[([\W\w]*)\]\(([\W\w]*)\)/g, (a, b, c) => { 
    return `<a href="${c}">${b || c}</a>`;
  })
};

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
/**
 * 
 * @param date - for example 2023-06-19 (YYYY-MM-DD)
 * @returns date in format DD.MM.YYYY
 */
export const formatDate = (date: string): string => {
  const regCheck = /(\d{4,})-(\d{2,})-(\d{2,})/g.exec(date);
  if (!regCheck) {
    console.log('date format is not YYYY-MM-DD');
    return date;
  }
  const [, year, month, day] = regCheck;
  return `${day}.${month}.${year}`;
};

export const dateToString = (date: Date, withTime?: boolean) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const time = date.toTimeString().split(' ')[0];
  return `${day < 10 ? '0' + day : day}.${month < 10 ? '0' + month : month}.${year}${withTime ? ' ' + time : ''}`;
};

/**
 * 
 * @param time - for example 320
 * @returns time in format {x} ч. {y} мин.
 */
export const formatTime = (time: number): string => {
  const minutes = time % 60;
  const hours = Math.floor(time / 60);
  return `${hours ? hours + 'ч. ' : ''} ${minutes ? minutes + 'мин.' : ''}`;
};