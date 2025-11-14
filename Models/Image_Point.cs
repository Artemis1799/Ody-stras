using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace t5_back.Models
{
    public class Image_Point
    {
        [Required]
        public Guid Image_ID { get; set; }
        
        [Required]
        public Guid Point_ID { get; set; }
        
        [ForeignKey("Image_ID")]
        public Photo Photo { get; set; }
        
        [ForeignKey("Point_ID")]
        public Point Point { get; set; }
    }
}